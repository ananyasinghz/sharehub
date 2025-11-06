// ShareHub-GetUserListings Lambda Function
// Gets all listings created by a specific user

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

// CORS headers to include in all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    try {
        // Get userId from path parameters
        const userId = event.pathParameters?.userId;
        
        if (!userId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'userId is required',
                    message: 'Please provide userId in the path' 
                })
            };
        }
        
        console.log('Fetching listings for user:', userId);
        
        // Query items using GSI (createdBy-createdAt-index)
        const params = {
            TableName: 'ShareHub-Listings',
            IndexName: 'createdBy-createdAt-index',
            KeyConditionExpression: 'createdBy = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false // Sort by createdAt descending (newest first)
        };
        
        const result = await dynamodb.send(new QueryCommand(params));
        
        console.log(`Found ${result.Items?.length || 0} listings for user ${userId}`);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                items: result.Items || [],
                count: result.Items?.length || 0
            })
        };
    } catch (error) {
        console.error('Error fetching user listings:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: error.message,
                type: error.name
            })
        };
    }
};

