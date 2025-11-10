// ShareHub-ClaimListing Lambda Function (ES Module version)
// Claims a listing for a user

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler = async (event) => {
    console.log('ClaimListing called with event:', JSON.stringify(event, null, 2));
    
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    try {
        // Get listing ID from path
        const listingId = event.pathParameters?.id;
        
        if (!listingId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Listing ID is required' 
                })
            };
        }
        
        // Parse request body
        let requestBody = {};
        if (event.body) {
            try {
                requestBody = JSON.parse(event.body);
            } catch (e) {
                console.error('Failed to parse body:', e);
            }
        }
        
        // Extract user info from JWT token (Authorization header)
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        let userId, userName;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Decode JWT payload (simple base64 decode, not verifying signature)
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            userId = payload.sub;
            userName = payload.name || payload.email;
            console.log('Extracted user from token:', { userId, userName });
        }
        
        // Fallback to request body if token parsing failed
        if (!userId && requestBody.userId) {
            userId = requestBody.userId;
            userName = requestBody.userName || 'Unknown User';
        }
        
        if (!userId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'User ID is required (must be authenticated)' 
                })
            };
        }
        
        console.log('Attempting to claim listing:', listingId, 'for user:', userId);
        
        // Get the listing
        const getListingResult = await dynamodb.send(new GetCommand({
            TableName: 'ShareHub-Listings',
            Key: { id: listingId }
        }));
        
        const listing = getListingResult.Item;
        
        if (!listing) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Listing not found' 
                })
            };
        }
        
        // Check if already claimed
        if (listing.status === 'claimed' && listing.claimedBy) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Listing has already been claimed',
                    claimedBy: listing.claimedBy
                })
            };
        }
        
        // Check if user is trying to claim their own listing
        if (listing.createdBy === userId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'You cannot claim your own listing' 
                })
            };
        }
        
        const now = new Date().toISOString();
        const claimId = randomUUID();
        
        // Update listing status
        await dynamodb.send(new UpdateCommand({
            TableName: 'ShareHub-Listings',
            Key: { id: listingId },
            UpdateExpression: 'SET #status = :status, claimedBy = :userId, claimedAt = :now',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'claimed',
                ':userId': userId,
                ':now': now
            }
        }));
        
        console.log('Updated listing status to claimed');
        
        // Create claim record
        const claim = {
            id: claimId,
            listingId: listingId,
            userId: userId,
            userName: userName,
            claimedBy: userId, // For GSI
            status: 'pending',
            createdAt: now
        };
        
        await dynamodb.send(new PutCommand({
            TableName: 'ShareHub-Claims',
            Item: claim
        }));
        
        console.log('Created claim record:', claim);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Listing claimed successfully',
                claim: claim,
                listing: {
                    ...listing,
                    status: 'claimed',
                    claimedBy: userId,
                    claimedAt: now
                }
            })
        };
        
    } catch (error) {
        console.error('Error in ClaimListing:', error);
        
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


