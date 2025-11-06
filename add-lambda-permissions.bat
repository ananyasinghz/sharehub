@echo off
echo Adding API Gateway invoke permissions to Lambda functions...
echo.

aws lambda add-permission --function-name ShareHub-CreateListing --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-CreateListing - Done

aws lambda add-permission --function-name ShareHub-GetListings --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-GetListings - Done

aws lambda add-permission --function-name ShareHub-GetListingById --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-GetListingById - Done

aws lambda add-permission --function-name ShareHub-UpdateListing --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-UpdateListing - Done

aws lambda add-permission --function-name ShareHub-DeleteListing --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-DeleteListing - Done

aws lambda add-permission --function-name ShareHub-ClaimListing --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-ClaimListing - Done

aws lambda add-permission --function-name ShareHub-GetUserListings --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-GetUserListings - Done

aws lambda add-permission --function-name ShareHub-GetUserClaims --statement-id apigateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:us-east-1:445971788368:7u59o8nxvg/*/*/*" --region us-east-1
echo ShareHub-GetUserClaims - Done

echo.
echo All permissions added successfully!
pause

