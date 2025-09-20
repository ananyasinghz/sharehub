# 🔐 Complete AWS Cognito Setup Guide for ShareHub
### Click-by-Click Instructions for Beginners

---

## 🎯 What You're Setting Up
You're creating an AWS Cognito User Pool that will handle:
- ✅ User registration (sign-up)
- ✅ Email verification
- ✅ User login/logout
- ✅ Password management
- ✅ JWT token generation for API access

---

## 📋 Page 1: Define Your Application

**You're currently on this page. Here's exactly what to enter:**

### Application Type
**🔘 Select: "Single-page application (SPA)"**
- ❌ NOT "Traditional web application" 
- ❌ NOT "Mobile app"
- ❌ NOT "Machine-to-machine"

**Why SPA?** Because ShareHub is built with React, which is a single-page application.

### Name Your Application
**📝 Enter: `ShareHub-WebApp`**
- This name is just for your reference in AWS Console
- You can also use: `ShareHub-Campus-Sharing` or similar

### Configure Options

#### Options for Sign-in Identifiers
**☑️ Check ONLY: "Email"**
- ❌ Uncheck "Phone number" 
- ❌ Uncheck "Username"

**Why email only?** Students always have email addresses, and it's easier to manage.

#### Required Attributes for Sign-up
**☑️ Check these attributes:**
- ✅ **Email address** (should be auto-checked)
- ✅ **Name** (given_name)

**🔍 How to add Name:**
1. Click "Select attributes" button
2. Scroll down and find "Name" or "given_name"
3. Check the box next to it
4. Click "Save" or "Done"

#### Add a Return URL (Optional)
**📝 Leave this BLANK for now**
- We'll configure this later after we deploy the app
- For development: You can leave empty or enter `http://localhost:5173`

### ✅ Click "Next" to continue

---

## 📋 Page 2: Configure Security Requirements

### Password Policy
**🔘 Select: "Cognito defaults"**
- Minimum 8 characters
- Contains lowercase letters
- Contains uppercase letters  
- Contains numbers
- Contains special characters

**OR if you want to customize:**
- **Minimum length**: 8
- **☑️ Require lowercase letters**
- **☑️ Require uppercase letters**  
- **☑️ Require numbers**
- **☑️ Require symbols**

### Multi-Factor Authentication (MFA)
**🔘 Select: "Optional MFA"**
- This allows users to enable MFA if they want, but doesn't force it
- Good for campus environment

### User Account Recovery
**☑️ Check: "Enable self-service account recovery"**
- **Recovery methods**: ☑️ Email only
- This lets users reset their own passwords

### ✅ Click "Next" to continue

---

## 📋 Page 3: Configure Sign-up Experience

### Self-Service Sign-up
**🔘 Select: "Enable self-service sign-up"**
- This allows students to create accounts themselves

### Cognito-Assisted Verification
**🔘 Select: "Send email verification message"**
- Students will get an email to verify their account

### Verifying Attribute Changes
**☑️ Keep email selected:**
- "Keep email address verified"

### Required Attributes
**Should already show:**
- ✅ Email address
- ✅ Name

### Custom Attributes
**🔧 This is IMPORTANT - Add custom attribute for campus:**

1. **Click "Add custom attribute"**
2. **Name**: `campus`
3. **Type**: `String`
4. **Min Length**: `1`
5. **Max Length**: `50`  
6. **☑️ Mutable**: Yes (users can change it)
7. **Click "Add attribute"**

### Attribute Verification Settings
**Leave defaults:**
- Email verification subject: (default)
- Email verification message: (default)

### ✅ Click "Next" to continue

---

## 📋 Page 4: Configure Message Delivery

### Email Provider
**🔘 Select: "Send email with Amazon SES"**
- If this is greyed out, select "Send email with Cognito" for now
- You can upgrade to SES later for better email delivery

**If using SES:**
- **SES Configuration**: Use default
- **FROM email address**: Leave default or enter: `noreply@your-domain.com`

### SMS Settings (if you had phone verification)
- Skip this since we're only using email

### ✅ Click "Next" to continue

---

## 📋 Page 5: Integrate Your App

### User Pool Name
**📝 Enter: `ShareHub-UserPool`**

### Hosted UI
**🔘 Select: "Use Cognito Hosted UI"**
- Even though we have custom UI, this helps with testing

**Domain Configuration:**
1. **🔘 Select: "Use a Cognito domain"**
2. **Domain prefix**: `sharehub-[your-initials]-[random-number]`
   - Example: `sharehub-js-12345`
   - Must be globally unique
3. **Click "Check availability"** - keep trying until you find an available one

### Initial App Client

#### App Client Name
**📝 Enter: `ShareHub-WebClient`**

#### Client Secret
**❌ IMPORTANT: Select "Don't generate a client secret"**
- Web apps (SPAs) should NOT have client secrets

#### Allowed Callback URLs
**📝 Enter both URLs (one per line):**
```
http://localhost:5173
https://your-domain.com
```
- First URL is for development
- Second URL is for production (you can add this later)

#### Allowed Sign-out URLs  
**📝 Enter both URLs (one per line):**
```
http://localhost:5173
https://your-domain.com
```

#### Identity Providers
**☑️ Check: "Cognito user pool"**
- You can add Google, Facebook later if needed

#### OAuth 2.0 Grant Types
**☑️ Check:**
- ✅ Authorization code grant
- ✅ Implicit grant

#### OpenID Connect Scopes
**☑️ Check all:**
- ✅ OpenID
- ✅ Email  
- ✅ Phone (if you added phone verification)
- ✅ Profile

### ✅ Click "Next" to continue

---

## 📋 Page 6: Review and Create

### Review All Settings
**🔍 Double-check these critical settings:**

- ✅ **Sign-in options**: Email only
- ✅ **Required attributes**: Email, Name
- ✅ **Custom attributes**: campus
- ✅ **MFA**: Optional
- ✅ **Self-service sign-up**: Enabled
- ✅ **App client**: No client secret
- ✅ **Callback URLs**: Include localhost:5173

### ✅ Click "Create User Pool"

---

## 📝 Save These Critical Values!

**After creation, you'll see the User Pool Overview. COPY AND SAVE:**

### 1. User Pool ID
**Location:** Top of the overview page
**Format:** `us-east-1_AbC123DeF`
**📝 Copy this value** - you'll need it for your `.env` file

### 2. User Pool ARN
**Location:** User pool overview section  
**Format:** `arn:aws:cognito-idp:us-east-1:123456789:userpool/us-east-1_AbC123DeF`
**📝 Copy this value** - for advanced configurations

---

## 🔧 Get Your App Client Information

### Navigate to App Integration Tab
1. **Click the "App integration" tab**
2. **Scroll down to "App clients and analytics"**
3. **Click on your app client name** (`ShareHub-WebClient`)

### Save App Client Details
**📝 Copy these values:**

#### Client ID  
**Location:** Client information section
**Format:** `1a2b3c4d5e6f7g8h9i0j1k2l3m`
**📝 This is your `VITE_AWS_USER_POOL_WEB_CLIENT_ID`**

#### Hosted UI URL
**Location:** Hosted UI section  
**Format:** `https://sharehub-js-12345.auth.us-east-1.amazoncognito.com`
**📝 Save for testing** (optional)

---

## 🔧 Set Up Identity Pool (For S3 Access)

### Why You Need This
**Identity Pool allows your app to:**
- ✅ Upload images to S3
- ✅ Access AWS services with temporary credentials
- ✅ Secure API calls

### Create Identity Pool

1. **Go to Amazon Cognito Console**
2. **Click "Identity pools" in the left sidebar**
3. **Click "Create identity pool"**

#### Identity Pool Configuration

**Identity pool name**: `ShareHub_IdentityPool`

**Authentication providers:**
1. **Click "Cognito" tab**
2. **User Pool ID**: `[Your User Pool ID from above]`
3. **App client id**: `[Your App Client ID from above]`

**Unauthenticated access:** 
- **🔘 Select: "Enable access to unauthenticated identities"**
- This allows browsing without login

4. **Click "Create identity pool"**

### Save Identity Pool ID
**📝 Copy the Identity Pool ID**
**Format:** `us-east-1:a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6`
**📝 This is your `VITE_AWS_IDENTITY_POOL_ID`**

---

## 📁 Update Your ShareHub Project

### 1. Update Environment Variables

**Edit your `.env.local` file:**
```env
# Change from development to production
VITE_APP_ENVIRONMENT=production

# Add your AWS Cognito values
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_YourPoolId  
VITE_AWS_USER_POOL_WEB_CLIENT_ID=your-app-client-id
VITE_AWS_IDENTITY_POOL_ID=us-east-1:your-identity-pool-id

# These you'll set up later
VITE_AWS_S3_BUCKET=
VITE_AWS_API_GATEWAY_URL=
VITE_AWS_SNS_TOPIC_ARN=

VITE_APP_NAME=ShareHub
```

### 2. Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 Test Your Cognito Setup

### 1. Test Sign-up Flow
1. **Go to** `http://localhost:5173`
2. **Click "Sign Up" or "Get Started"**
3. **Fill out the form:**
   - Name: Test User
   - Email: your-email@test.com  
   - Campus: Test Campus
   - Password: TestPassword123!
4. **Check your email** for verification code
5. **Enter verification code**
6. **Should be logged in successfully**

### 2. Test Sign-in Flow  
1. **Log out** (if logged in)
2. **Click "Sign In"**
3. **Enter your email and password**
4. **Should log in successfully**

### 3. Check Browser Console
**Should see:**
```
🚀 ShareHub running in PRODUCTION mode
User authenticated: [user object]
```

**Should NOT see:**
```
❌ Auth UserPool not configured errors
```

---

## 🎉 Success Checklist

**✅ Cognito User Pool created and configured**
**✅ App client created without secret**
**✅ Identity pool created for S3 access**  
**✅ Environment variables updated**
**✅ App running in production mode**
**✅ Sign-up flow working**
**✅ Email verification working**
**✅ Sign-in flow working**
**✅ No console errors**

---

## 🚨 Troubleshooting

### Problem: "Invalid redirect URI" error
**Solution:**
1. Go to Cognito Console → Your User Pool → App integration → Your app client
2. Edit "Allowed callback URLs" 
3. Make sure `http://localhost:5173` is included

### Problem: "Client secret not provided" error  
**Solution:**
1. Your app client has a secret (bad for SPAs)
2. Create a new app client without secret
3. Update your client ID in `.env.local`

### Problem: Email verification not working
**Solution:**  
1. Check spam folder
2. Verify email settings in Cognito Console
3. Try using SES instead of Cognito email

### Problem: "Access denied" errors
**Solution:**
1. Check Identity Pool configuration
2. Verify User Pool ID and App Client ID match
3. Check IAM roles for Identity Pool

---

## 📞 Next Steps

**After Cognito is working:**
1. ✅ **Set up S3 bucket** for image uploads
2. ✅ **Create DynamoDB tables** for data storage  
3. ✅ **Set up API Gateway + Lambda** for backend
4. ✅ **Configure SNS** for notifications
5. ✅ **Deploy to production**

**Your ShareHub app now has real AWS authentication! 🎉**

---

## 💡 Pro Tips

### Testing
- **Always test both sign-up and sign-in flows**
- **Check email verification works**  
- **Test password reset functionality**

### Security
- **Never commit `.env.local` to Git**
- **Use different User Pools for dev/staging/production**
- **Enable MFA for admin accounts**

### Performance  
- **Monitor Cognito usage in CloudWatch**
- **Set up billing alerts**
- **Use Cognito caching for better performance**

**Happy coding! Your ShareHub is now powered by AWS Cognito! 🚀**

