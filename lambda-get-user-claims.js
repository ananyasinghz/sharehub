// ShareHub-GetUserClaims Lambda Function
// Gets all claims made by a specific user

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");

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
        
        console.log('Fetching claims for user:', userId);
        
        // Query claims using GSI (userId-createdAt-index)
        const params = {
            TableName: 'ShareHub-Claims',
            IndexName: 'userId-createdAt-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false // Sort by createdAt descending (newest first)
        };
        
        const result = await dynamodb.send(new QueryCommand(params));
        const claims = result.Items || [];
        
        console.log(`Found ${claims.length} claims for user ${userId}`);
        
        // If there are claims, fetch the associated listing details
        if (claims.length > 0) {
            const listingIds = [...new Set(claims.map(claim => claim.listingId))];
            
            // Batch get listings
            const listingsParams = {
                RequestItems: {
                    'ShareHub-Listings': {
                        Keys: listingIds.map(id => ({ id }))
                    }
                }
            };
            
            const listingsResult = await dynamodb.send(new BatchGetCommand(listingsParams));
            const listings = listingsResult.Responses['ShareHub-Listings'] || [];
            
            // Create a map for quick lookup
            const listingsMap = {};
            listings.forEach(listing => {
                listingsMap[listing.id] = listing;
            });
            
            // Enrich claims with listing details
            const enrichedClaims = claims.map(claim => ({
                ...claim,
                listing: listingsMap[claim.listingId] || null
            }));
            
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    items: enrichedClaims,
                    count: enrichedClaims.length
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                items: [],
                count: 0
            })
        };
    } catch (error) {
        console.error('Error fetching user claims:', error);
        
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

