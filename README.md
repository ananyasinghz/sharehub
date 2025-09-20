# ShareHub - Campus Sharing Network

A React + AWS full-stack application that enables students to share surplus food and items within their campus community. Built with modern technologies and deployed on AWS free-tier services.

![ShareHub Logo](https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&h=300)

## 🚀 Features

- **User Authentication**: Secure signup/login with AWS Cognito
- **Item Sharing**: Create listings with image uploads stored in S3
- **Browse & Search**: Find items by category, campus, or search terms  
- **Claim System**: Claim items and manage pickup arrangements
- **Real-time Notifications**: Email notifications via SNS
- **User Dashboard**: Track your listings and claimed items
- **Responsive Design**: Mobile-friendly interface with dark mode support
- **Campus Integration**: Filter content by specific campus locations

## 🏗️ Architecture

### Frontend Technologies
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **AWS Amplify** for AWS service integration

### AWS Services
- **🔐 Amazon Cognito**: User authentication and management
- **🗄️ Amazon S3**: Image storage with presigned URLs
- **🌐 API Gateway**: RESTful API endpoints
- **⚡ AWS Lambda**: Business logic and data processing
- **📊 Amazon DynamoDB**: NoSQL database for listings and user data
- **📧 Amazon SNS**: Email notifications
- **☁️ CloudWatch**: Logging and monitoring
- **🌍 Amazon Location** (Optional): Geofencing for nearby listings

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm installed
- **AWS Account** with appropriate permissions
- **AWS CLI** configured with your credentials
- **Git** for version control

## 🛠️ Local Development Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd sharehub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:

```env
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=your-user-pool-id
VITE_AWS_USER_POOL_WEB_CLIENT_ID=your-app-client-id
VITE_AWS_IDENTITY_POOL_ID=your-identity-pool-id
VITE_AWS_S3_BUCKET=your-s3-bucket-name
VITE_AWS_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:account:topic-name

# App Configuration
VITE_APP_NAME=ShareHub
VITE_APP_ENVIRONMENT=development
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## ☁️ AWS Setup & Deployment

### Step 1: Create AWS Cognito User Pool

1. **Navigate to AWS Cognito Console**
   - Go to AWS Console → Cognito → User Pools
   - Click "Create User Pool"

2. **Configure Sign-in Experience**
   - Sign-in options: Email
   - Cognito user pool sign-in options: Email

3. **Configure Security Requirements**
   - Password policy: Default or custom
   - Multi-factor authentication: Optional (recommended: Optional MFA)

4. **Configure Sign-up Experience**
   - Self-service sign-up: Enable
   - Cognito-assisted verification: Send email verification message
   - Required attributes: email, name
   - Custom attributes: Add `campus` (String, Mutable)

5. **Configure Message Delivery**
   - Email provider: Send email with Cognito (for testing) or SES (production)

6. **Integrate Your App**
   - User pool name: `ShareHub-UserPool`
   - App client name: `ShareHub-WebClient`
   - Don't generate client secret (for web apps)

### Step 2: Create Amazon S3 Bucket

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-sharehub-bucket-name --region us-east-1
   ```

2. **Configure Bucket Policy** (for public read access to images)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-sharehub-bucket-name/public/*"
       }
     ]
   }
   ```

3. **Configure CORS**
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

### Step 3: Create API Gateway & Lambda Functions

1. **Create DynamoDB Tables**
   
   **Listings Table:**
   ```bash
   aws dynamodb create-table \
     --table-name ShareHub-Listings \
     --attribute-definitions \
       AttributeName=id,AttributeType=S \
       AttributeName=createdAt,AttributeType=S \
       AttributeName=campus,AttributeType=S \
     --key-schema \
       AttributeName=id,KeyType=HASH \
     --global-secondary-indexes \
       IndexName=campus-createdAt-index,KeySchema=[{AttributeName=campus,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
   ```

   **Users Table:**
   ```bash
   aws dynamodb create-table \
     --table-name ShareHub-Users \
     --attribute-definitions AttributeName=id,AttributeType=S \
     --key-schema AttributeName=id,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
   ```

   **Claims Table:**
   ```bash
   aws dynamodb create-table \
     --table-name ShareHub-Claims \
     --attribute-definitions \
       AttributeName=id,AttributeType=S \
       AttributeName=listingId,AttributeType=S \
       AttributeName=claimedBy,AttributeType=S \
     --key-schema AttributeName=id,KeyType=HASH \
     --global-secondary-indexes \
       IndexName=listingId-index,KeySchema=[{AttributeName=listingId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
       IndexName=claimedBy-index,KeySchema=[{AttributeName=claimedBy,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
   ```

2. **Create Lambda Functions** (Examples)

   Create these Lambda functions to handle API requests:
   - `ShareHub-GetListings`: Fetch all listings with filtering
   - `ShareHub-CreateListing`: Create new listings
   - `ShareHub-ClaimListing`: Handle claim functionality
   - `ShareHub-GetUserData`: Fetch user profile and activity

3. **Create API Gateway**
   - Create REST API named "ShareHub-API"
   - Configure resources and methods
   - Connect to Lambda functions
   - Enable CORS

### Step 4: Configure SNS for Notifications

1. **Create SNS Topic**
   ```bash
   aws sns create-topic --name ShareHub-Notifications
   ```

2. **Subscribe to Topic** (for email notifications)
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:your-account:ShareHub-Notifications \
     --protocol email \
     --notification-endpoint admin@yourschool.edu
   ```

### Step 5: Deploy Frontend

#### Option A: Deploy to S3 + CloudFront

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to S3**
   ```bash
   aws s3 sync dist/ s3://your-frontend-bucket-name --delete
   ```

3. **Configure S3 for Static Website Hosting**
   ```bash
   aws s3 website s3://your-frontend-bucket-name \
     --index-document index.html \
     --error-document index.html
   ```

#### Option B: Deploy with AWS Amplify

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify Project**
   ```bash
   amplify init
   ```

3. **Add Hosting**
   ```bash
   amplify add hosting
   ```

4. **Deploy**
   ```bash
   amplify publish
   ```

## 🔧 Configuration Details

### AWS Amplify Configuration
The app uses AWS Amplify for seamless integration with AWS services. Configuration is handled in `src/config/aws.ts`.

### Environment Variables
All sensitive configuration is managed through environment variables:

- `VITE_AWS_REGION`: Your AWS region
- `VITE_AWS_USER_POOL_ID`: Cognito User Pool ID
- `VITE_AWS_USER_POOL_WEB_CLIENT_ID`: Cognito App Client ID
- `VITE_AWS_IDENTITY_POOL_ID`: Cognito Identity Pool ID (for S3 access)
- `VITE_AWS_S3_BUCKET`: S3 bucket name for file storage
- `VITE_AWS_API_GATEWAY_URL`: API Gateway endpoint URL
- `VITE_AWS_SNS_TOPIC_ARN`: SNS topic ARN for notifications

### Service Architecture

#### Authentication Service (`src/services/authService.ts`)
- Handles user registration with email confirmation
- Manages login/logout with JWT tokens
- Provides session management and refresh

#### Listing Service (`src/services/listingService.ts`)
- CRUD operations for listings via API Gateway
- Includes fallback data for development
- Handles filtering, searching, and pagination

#### S3 Service (`src/services/s3Service.ts`)
- File upload with presigned URLs
- Direct uploads and public URL generation
- File management and cleanup

#### Notification Service (`src/services/notificationService.ts`)
- Email notifications via SNS
- Template-based messaging
- Event-triggered notifications

## 📱 Usage Guide

### For Students

1. **Sign Up**
   - Create account with university email
   - Confirm email address
   - Select your campus

2. **Share Items**
   - Click "Share an Item"
   - Upload photo and description
   - Set category and expiration
   - Submit listing

3. **Find Items**
   - Browse all listings
   - Filter by category or campus
   - Search for specific items
   - View item details

4. **Claim Items**
   - Click "Claim Item" on listings
   - Contact the owner via provided information
   - Arrange pickup details
   - Mark as completed after pickup

### For Administrators

1. **Monitor Usage**
   - View CloudWatch logs and metrics
   - Monitor Cognito user registrations
   - Track API Gateway usage

2. **Manage Content**
   - Review reported listings
   - Moderate user activity
   - Send community announcements

## 🚦 API Endpoints

The application expects these API Gateway endpoints:

### Listings
- `GET /listings` - Get all listings with filters
- `GET /listings/{id}` - Get specific listing
- `POST /listings` - Create new listing
- `PUT /listings/{id}` - Update listing
- `DELETE /listings/{id}` - Delete listing
- `POST /listings/{id}/claim` - Claim a listing

### Users
- `GET /users/{id}` - Get user profile
- `GET /users/{id}/listings` - Get user's listings
- `GET /users/{id}/claims` - Get user's claims
- `PUT /users/{id}` - Update user profile

### Stats
- `GET /stats` - Get platform statistics
- `GET /users/{id}/stats` - Get user statistics

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure API Gateway has CORS enabled
   - Check S3 bucket CORS configuration
   - Verify allowed origins include your domain

2. **Authentication Issues**
   - Verify Cognito configuration
   - Check environment variables
   - Ensure user pool allows email sign-in

3. **File Upload Problems**
   - Check S3 bucket permissions
   - Verify IAM roles for Cognito Identity Pool
   - Ensure presigned URL generation is working

4. **API Connectivity**
   - Verify API Gateway endpoint URL
   - Check Lambda function permissions
   - Monitor CloudWatch logs for errors

### Development Mode
The app includes fallback data and mock functionality for development:
- Uses local storage for auth state
- Provides sample listings data
- Simulates API responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with AWS free-tier services
- Uses Pexels for placeholder images
- Inspired by campus sharing initiatives
- Community-driven development

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@sharehub.edu
- Documentation: [Wiki](https://github.com/your-repo/wiki)

---

**Made with ❤️ for campus communities**
