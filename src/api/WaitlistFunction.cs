using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Azure;
using Azure.Data.Tables;
using System.Net;

namespace api
{
    public class WaitlistEntry
    {
        public string Email { get; set; }
        public string CaseManagementSystem { get; set; }
        public string AgencyType { get; set; }
    }

    public class WaitlistResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public WaitlistData Data { get; set; }
    }

    public class WaitlistData
    {
        public string Id { get; set; }
        public string Email { get; set; }
    }

    public class WaitlistTableEntity : ITableEntity
    {
        public string PartitionKey { get; set; }
        public string RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
        public string Email { get; set; }
        public string CaseManagementSystem { get; set; }
        public string AgencyType { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public static class WaitlistFunction
    {
        [FunctionName("WaitlistFunction")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
            [Table("WaitlistEntries")] TableClient tableClient,
            ILogger log)
        {
            log.LogInformation("Processing waitlist entry request.");

            try
            {
                // Ensure table exists
                try
                {
                    await tableClient.CreateIfNotExistsAsync();
                    log.LogInformation("Table exists or was created successfully.");
                }
                catch (RequestFailedException e)
                {
                    log.LogError($"Error creating table: {e.Message}. Status: {e.Status}, ErrorCode: {e.ErrorCode}");
                    return new ObjectResult(new WaitlistResponse
                    {
                        Success = false,
                        Message = "Unable to initialize storage. Please try again later.",
                        Data = null
                    })
                    {
                        StatusCode = (int)HttpStatusCode.InternalServerError
                    };
                }

                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                log.LogInformation($"Received request body: {requestBody}");
                
                var entry = JsonConvert.DeserializeObject<WaitlistEntry>(requestBody);

                if (entry == null || string.IsNullOrEmpty(entry.Email))
                {
                    log.LogWarning("Invalid request: Email is missing or request body is malformed.");
                    return new BadRequestObjectResult(new WaitlistResponse
                    {
                        Success = false,
                        Message = "Invalid request. Email is required.",
                        Data = null
                    });
                }

                // Create table entity
                var id = Guid.NewGuid().ToString("N");
                var tableEntity = new WaitlistTableEntity
                {
                    PartitionKey = "waitlist",
                    RowKey = id,
                    Email = entry.Email,
                    CaseManagementSystem = entry.CaseManagementSystem,
                    AgencyType = entry.AgencyType,
                    CreatedAt = DateTime.UtcNow
                };

                try
                {
                    // Add to table storage
                    await tableClient.AddEntityAsync(tableEntity);
                    log.LogInformation($"Successfully added entry to table storage for email: {entry.Email}");
                }
                catch (RequestFailedException e)
                {
                    log.LogError($"Storage error while adding entity: {e.Message}. Status: {e.Status}, ErrorCode: {e.ErrorCode}");
                    return new ObjectResult(new WaitlistResponse
                    {
                        Success = false,
                        Message = "Unable to save your entry. Please try again later.",
                        Data = null
                    })
                    {
                        StatusCode = (int)HttpStatusCode.InternalServerError
                    };
                }

                var response = new WaitlistResponse
                {
                    Success = true,
                    Message = "Successfully added to waitlist",
                    Data = new WaitlistData
                    {
                        Id = id,
                        Email = entry.Email
                    }
                };

                log.LogInformation($"Successfully processed waitlist entry for email: {entry.Email}");
                return new OkObjectResult(response);
            }
            catch (Exception ex)
            {
                log.LogError($"Unexpected error processing waitlist entry: {ex.Message}\nStack trace: {ex.StackTrace}");
                return new ObjectResult(new WaitlistResponse
                {
                    Success = false,
                    Message = "An unexpected error occurred while processing your request.",
                    Data = null
                })
                {
                    StatusCode = (int)HttpStatusCode.InternalServerError
                };
            }
        }
    }
}
