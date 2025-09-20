# 🚀 Complete AWS Setup Guide for ShareHub
### For Complete Beginners - Step by Step

## 🔧 Immediate Fix: Stop Console Errors

**First, create a `.env.local` file in your project root with this content:**

```env
# Development Environment Variables
VITE_APP_ENVIRONMENT=development
VITE_AWS_REGION=
VITE_AWS_USER_POOL_ID=
VITE_AWS_USER_POOL_WEB_CLIENT_ID=
VITE_AWS_IDENTITY_POOL_ID=
VITE_AWS_S3_BUCKET=
VITE_AWS_API_GATEWAY_URL=
VITE_AWS_SNS_TOPIC_ARN=
VITE_APP_NAME=ShareHub
```

**Then restart your dev server:**
```bash
npm run dev
```

✅ **Console errors should now be gone!** The app will use mock data until you set up AWS.

---

## 🎯 AWS Account Setup (Start Here!)

### Step 1: Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Fill in:
   - Email address
   - Password  
   - AWS account name (can be anything, e.g., "ShareHub-Development")
4. Choose **Personal** account type
5. Fill in contact information
6. **Payment Information**: Add credit card (required, but won't be charged on free tier)
7. **Identity Verification**: Phone verification
8. **Select Support Plan**: Choose "Basic Plan" (Free)

### Step 2: Secure Your Account
1. **Enable MFA (Multi-Factor Authentication)**:
   - Go to IAM Console → Users → your root user
   - Click "Security credentials" tab
   - Click "Assign MFA device"
   - Use Google Authenticator or similar app

2. **Create IAM User** (Recommended):
   - Go to IAM Console → Users → "Add user"
   - Username: `sharehub-admin`
   - Access type: Both programmatic and console access
   - Attach policy: `AdministratorAccess`
   - Save the credentials!

---

## 🔐 Step-by-Step AWS Service Setup

### 🎪 Phase 1: Amazon Cognito (User Authentication)

**1. Go to AWS Cognito Console**
   - Sign in to AWS Console
   - Search for "Cognito" and click on it
   - Click "Create User Pool"

**2. Configure Sign-in Experience**
   - **Cognito user pool sign-in options**: Check "Email"
   - **User name**: Leave defaults
   - Click "Next"

**3. Configure Security Requirements**
   - **Password policy**: 
     - Minimum length: 8
     - Check: Lowercase, Uppercase, Numbers, Special characters
   - **Multi-factor authentication**: Optional MFA
   - **User account recovery**: Enable self-service account recovery
   - Click "Next"

**4. Configure Sign-up Experience**
   - **Self-service sign-up**: Enable
   - **Cognito-assisted verification**: Send email verification message
   - **Verifying attribute changes**: Keep email verified
   - **Required attributes**: Select "email" and "name"
   - **Custom attributes**: 
     - Click "Add custom attribute"
     - Name: `campus`
     - Type: String
     - Mutable: Yes
   - Click "Next"

**5. Configure Message Delivery**
   - **Email provider**: Send email with Cognito (for now)
   - Click "Next"

**6. Integrate Your App**
   - **User pool name**: `ShareHub-UserPool`
   - **Hosted UI**: 
     - Use Cognito Hosted UI: No (we have custom UI)
   - **Initial app client**:
     - App client name: `ShareHub-WebClient`
     - Client secret: Don't generate (important for web apps)
   - Click "Next"

**7. Review and Create**
   - Review all settings
   - Click "Create user pool"

**8. Save Your Settings**
   - Copy the **User Pool ID** (starts with us-east-1_...)
   - Go to "App integration" tab
   - Copy the **Client ID** (long alphanumeric string)

### 📁 Phase 2: Amazon S3 (File Storage)

**1. Go to S3 Console**
   - Search for "S3" in AWS Console
   - Click "Create bucket"

**2. Bucket Configuration**
   - **Bucket name**: `sharehub-[your-name]-[random-number]` (must be globally unique)
     - Example: `sharehub-john-12345`
   - **Region**: us-east-1 (N. Virginia) - cheapest
   - **Object ownership**: ACLs disabled (recommended)
   - **Block public access**: Uncheck "Block all public access"
     - ⚠️ Check "I acknowledge that the current settings might result in this bucket and the objects within becoming public"
   - Click "Create bucket"

**3. Configure CORS**
   - Go to your bucket → "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Click "Edit" and paste:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

**4. Configure Bucket Policy**
   - Still in "Permissions" tab
   - Scroll to "Bucket policy"
   - Click "Edit" and paste (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/public/*"
        }
    ]
}
```

### 💾 Phase 3: DynamoDB (Database)

**1. Go to DynamoDB Console**
   - Search for "DynamoDB" in AWS Console
   - Click "Create table"

**2. Create Listings Table**
   - **Table name**: `ShareHub-Listings`
   - **Primary key**: 
     - Partition key: `id` (String)
   - **Table settings**: Use default settings
   - Click "Create table"

**3. Create Users Table**
   - Click "Create table" again
   - **Table name**: `ShareHub-Users`
   - **Primary key**: 
     - Partition key: `id` (String)
   - Click "Create table"

**4. Create Claims Table**
   - Click "Create table" again
   - **Table name**: `ShareHub-Claims`
   - **Primary key**: 
     - Partition key: `id` (String)
   - Click "Create table"

### ⚡ Phase 4: Lambda Functions

**1. Go to Lambda Console**
   - Search for "Lambda" in AWS Console
   - Click "Create function"

**2. Create First Function - Get Listings**
   - **Function name**: `ShareHub-GetListings`
   - **Runtime**: Node.js 18.x
   - **Architecture**: x86_64
   - Click "Create function"

**3. Add Function Code**
   - In the code editor, replace the code with:

```javascript
exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    try {
        const result = await dynamodb.scan({
            TableName: 'ShareHub-Listings'
        }).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*'
            },
            body: JSON.stringify({
                items: result.Items || []
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

**4. Configure Permissions**
   - Go to "Configuration" tab → "Permissions"
   - Click on the role name
   - Click "Attach policies"
   - Search and attach: `AmazonDynamoDBFullAccess`

**Repeat for other Lambda functions:** (Create similar functions for CreateListing, UpdateListing, etc.)

### 🌐 Phase 5: API Gateway

**1. Go to API Gateway Console**
   - Search for "API Gateway" in AWS Console
   - Choose "REST API" (not private)
   - Click "Build"

**2. Create API**
   - **API name**: `ShareHub-API`
   - **Description**: ShareHub Campus Sharing API
   - **Endpoint type**: Regional
   - Click "Create API"

**3. Create Resources and Methods**
   - Click "Actions" → "Create Resource"
   - **Resource name**: listings
   - **Resource path**: /listings
   - **Enable CORS**: Yes
   - Click "Create Resource"

**4. Add GET Method**
   - Select "/listings" resource
   - Click "Actions" → "Create Method"
   - Choose "GET" and click the checkmark
   - **Integration type**: Lambda Function
   - **Lambda function**: ShareHub-GetListings
   - Click "Save"

**5. Deploy API**
   - Click "Actions" → "Deploy API"
   - **Deployment stage**: [New Stage]
   - **Stage name**: prod
   - Click "Deploy"
   - **Copy the Invoke URL** - this is your API Gateway URL!

### 📧 Phase 6: SNS (Email Notifications)

**1. Go to SNS Console**
   - Search for "SNS" in AWS Console
   - Click "Create topic"

**2. Create Topic**
   - **Type**: Standard
   - **Name**: `ShareHub-Notifications`
   - Click "Create topic"
   - **Copy the Topic ARN**

**3. Create Subscription**
   - Click "Create subscription"
   - **Topic ARN**: (auto-filled)
   - **Protocol**: Email
   - **Endpoint**: your-email@example.com
   - Click "Create subscription"
   - **Check your email** and confirm the subscription

---

## 🔧 Connect AWS to Your App

**Now update your `.env.local` file with your real AWS values:**

```env
VITE_APP_ENVIRONMENT=production
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_AWS_USER_POOL_WEB_CLIENT_ID=xxxxxxxxxxxxxxxxxx
VITE_AWS_IDENTITY_POOL_ID=
VITE_AWS_S3_BUCKET=sharehub-yourname-12345
VITE_AWS_API_GATEWAY_URL=https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:ShareHub-Notifications
VITE_APP_NAME=ShareHub
```

**Restart your app:**
```bash
npm run dev
```

---

## 🎉 Testing Your Setup

### Test Authentication
1. Go to your app at `http://localhost:5173`
2. Click "Get Started" or "Sign Up"
3. Create a new account
4. Check if you can sign in

### Test File Upload
1. Sign in to your app
2. Go to "Share an Item"
3. Upload an image
4. Check if it appears in S3 bucket

### Test API
1. Create a listing
2. Check if it appears in DynamoDB table
3. Refresh the listings page

---

## 💰 Cost Management

### Set Up Billing Alerts
1. Go to AWS Console → Billing and Cost Management
2. Click "Budgets" → "Create budget"
3. **Budget type**: Cost budget
4. **Budget amount**: $1.00 (very low to catch any charges)
5. Set up email notifications

### Monitor Usage
- Check AWS Cost Explorer weekly
- Review DynamoDB read/write consumption
- Monitor S3 storage and requests
- Watch Lambda execution time

---

## 🚀 Deployment Options

### Option 1: S3 Static Hosting
```bash
# Build the app
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Enable static website hosting
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
```

### Option 2: AWS Amplify Hosting
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

---

## 🆘 Common Issues & Solutions

### Issue: CORS Errors
**Solution:** 
- Check API Gateway CORS settings
- Verify S3 bucket CORS configuration
- Ensure proper headers in Lambda functions

### Issue: Authentication Not Working
**Solution:**
- Verify Cognito User Pool ID and Client ID
- Check environment variables
- Confirm User Pool allows email sign-in

### Issue: File Upload Fails
**Solution:**
- Check S3 bucket permissions
- Verify bucket policy allows public read
- Confirm CORS settings

### Issue: API Calls Fail
**Solution:**
- Check API Gateway deployment
- Verify Lambda function permissions
- Test individual endpoints in API Gateway console

---

## 📈 Next Steps After Setup

1. **Test thoroughly** with multiple user accounts
2. **Add more Lambda functions** for complete CRUD operations
3. **Set up CloudWatch monitoring** for logs and metrics  
4. **Configure custom domain** (optional)
5. **Add CloudFront** for faster global delivery
6. **Set up CI/CD pipeline** for automatic deployments

## 🎯 Success Checklist

- [ ] AWS account created and secured
- [ ] Cognito User Pool configured
- [ ] S3 bucket with proper permissions
- [ ] DynamoDB tables created
- [ ] Lambda functions deployed
- [ ] API Gateway configured and deployed
- [ ] SNS topic and subscriptions set up
- [ ] Environment variables configured
- [ ] App connects to AWS services
- [ ] Authentication works
- [ ] File uploads work
- [ ] API calls work
- [ ] Billing alerts configured

**Total estimated setup time: 2-4 hours for a beginner** 

Your ShareHub app will be fully functional and running on AWS free tier! 🎉

