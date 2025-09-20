import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { fetchAuthSession } from '@aws-amplify/auth';
import { env } from '../config/aws';

export interface NotificationData {
  to: string;
  subject: string;
  message: string;
  type?: 'email' | 'sms';
}

export interface ClaimNotificationData {
  ownerEmail: string;
  ownerName: string;
  claimerName: string;
  listingTitle: string;
  listingId: string;
  claimerEmail: string;
}

class NotificationService {
  private snsClient: SNSClient | null = null;

  private async getSNSClient(): Promise<SNSClient> {
    if (!this.snsClient) {
      const session = await fetchAuthSession();
      const credentials = session.credentials;

      if (!credentials) {
        throw new Error('No AWS credentials available');
      }

      this.snsClient = new SNSClient({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }
      });
    }

    return this.snsClient;
  }

  /**
   * Send a generic notification via SNS
   */
  async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      const snsClient = await this.getSNSClient();

      const publishCommand = new PublishCommand({
        TopicArn: env.AWS_SNS_TOPIC_ARN,
        Message: JSON.stringify({
          default: data.message,
          email: this.formatEmailMessage(data.subject, data.message),
          sms: data.message.substring(0, 160) // SMS limit
        }),
        Subject: data.subject,
        MessageStructure: 'json',
        MessageAttributes: {
          'notification_type': {
            DataType: 'String',
            StringValue: data.type || 'email'
          },
          'recipient': {
            DataType: 'String',
            StringValue: data.to
          }
        }
      });

      await snsClient.send(publishCommand);
      console.log('Notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send notification when someone claims a listing
   */
  async notifyListingClaimed(data: ClaimNotificationData): Promise<boolean> {
    const subject = `Someone claimed your item: ${data.listingTitle}`;
    const message = `Hi ${data.ownerName},

Great news! ${data.claimerName} has claimed your item "${data.listingTitle}" on ShareHub.

Next Steps:
1. ${data.claimerName} will contact you at ${data.claimerEmail} to arrange pickup
2. You can also reach out to them directly
3. Please coordinate a convenient time and location for pickup

Item Details:
- Title: ${data.listingTitle}
- Claimed by: ${data.claimerName} (${data.claimerEmail})
- Listing ID: ${data.listingId}

Thank you for sharing with your campus community!

Best regards,
The ShareHub Team

---
This is an automated message. Please do not reply to this email.`;

    return this.sendNotification({
      to: data.ownerEmail,
      subject,
      message,
      type: 'email'
    });
  }

  /**
   * Send welcome notification to new users
   */
  async notifyWelcome(userEmail: string, userName: string, campus: string): Promise<boolean> {
    const subject = 'Welcome to ShareHub!';
    const message = `Welcome to ShareHub, ${userName}!

Thank you for joining the ${campus} sharing community. You're now part of a network of students helping each other by sharing surplus items and reducing waste.

Here's what you can do:
• Browse available items from fellow students
• Share items you no longer need
• Claim items that could be useful to you
• Track your sharing activity in your dashboard

Ready to get started?
Visit ShareHub and start exploring what your campus community is sharing!

Happy sharing!
The ShareHub Team`;

    return this.sendNotification({
      to: userEmail,
      subject,
      message,
      type: 'email'
    });
  }

  /**
   * Send notification for listing expiration reminder
   */
  async notifyListingExpiring(userEmail: string, userName: string, listingTitle: string, expirationDate: Date): Promise<boolean> {
    const daysUntilExpiry = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const subject = `Your listing expires ${daysUntilExpiry <= 1 ? 'soon' : `in ${daysUntilExpiry} days`}`;
    const message = `Hi ${userName},

Your listing "${listingTitle}" will expire on ${expirationDate.toLocaleDateString()}.

${daysUntilExpiry <= 1 ? 
  'This is your final reminder! Your listing will expire soon.' : 
  `You have ${daysUntilExpiry} days remaining.`}

What you can do:
• Update your listing if needed
• Extend the expiration date
• Mark it as no longer available if already shared

Visit your dashboard to manage your listings.

Thanks for sharing with your community!
The ShareHub Team`;

    return this.sendNotification({
      to: userEmail,
      subject,
      message,
      type: 'email'
    });
  }

  /**
   * Send notification for successful item pickup
   */
  async notifyPickupComplete(ownerEmail: string, claimerEmail: string, ownerName: string, claimerName: string, listingTitle: string): Promise<boolean> {
    // Notify owner
    const ownerSubject = 'Item pickup completed';
    const ownerMessage = `Hi ${ownerName},

${claimerName} has confirmed they received "${listingTitle}". Thanks for sharing with your community!

Your positive impact:
• Helped a fellow student
• Reduced waste
• Strengthened campus connections

Keep up the great sharing!
The ShareHub Team`;

    // Notify claimer
    const claimerSubject = 'Thanks for using ShareHub!';
    const claimerMessage = `Hi ${claimerName},

Thanks for confirming you received "${listingTitle}" from ${ownerName}!

Remember:
• Show appreciation to ${ownerName}
• Consider sharing items you no longer need
• Help build a stronger campus community

Happy to help connect you with great items!
The ShareHub Team`;

    // Send both notifications
    const ownerNotification = this.sendNotification({
      to: ownerEmail,
      subject: ownerSubject,
      message: ownerMessage,
      type: 'email'
    });

    const claimerNotification = this.sendNotification({
      to: claimerEmail,
      subject: claimerSubject,
      message: claimerMessage,
      type: 'email'
    });

    const results = await Promise.all([ownerNotification, claimerNotification]);
    return results.every(result => result);
  }

  /**
   * Send daily digest notification
   */
  async notifyDailyDigest(userEmail: string, userName: string, stats: any): Promise<boolean> {
    const subject = 'Your daily ShareHub digest';
    const message = `Good morning, ${userName}!

Here's what's happening in your campus sharing community:

📊 Today's Stats:
• ${stats.newListings || 0} new items shared
• ${stats.claimedItems || 0} items claimed
• ${stats.activeUsers || 0} active community members

🎯 For You:
• ${stats.recommendedItems || 0} recommended items based on your interests
• ${stats.yourActiveListings || 0} of your listings are still active
• ${stats.yourClaims || 0} items you've claimed are pending pickup

Trending Categories:
${stats.trendingCategories?.map((cat: any) => `• ${cat.name}: ${cat.count} items`).join('\n') || '• Check the app for trending items!'}

Ready to discover something new or share something great?
Visit ShareHub to see what's available today!

Have a great day!
The ShareHub Team`;

    return this.sendNotification({
      to: userEmail,
      subject,
      message,
      type: 'email'
    });
  }

  /**
   * Format email message with proper HTML structure
   */
  private formatEmailMessage(subject: string, message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ShareHub</h1>
        <p>Campus Sharing Network</p>
    </div>
    <div class="content">
        ${message.replace(/\n/g, '<br>')}
    </div>
    <div class="footer">
        <p>&copy; 2024 ShareHub. All rights reserved.</p>
        <p>This email was sent to you as part of your ShareHub account activity.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Test notification sending (for development)
   */
  async testNotification(): Promise<boolean> {
    return this.sendNotification({
      to: 'test@example.com',
      subject: 'ShareHub Test Notification',
      message: 'This is a test notification from ShareHub to verify SNS integration.',
      type: 'email'
    });
  }
}

export const notificationService = new NotificationService();
