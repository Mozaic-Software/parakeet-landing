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
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var entry = JsonConvert.DeserializeObject<WaitlistEntry>(requestBody);

                if (entry == null || string.IsNullOrEmpty(entry.Email))
                {
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

                // Add to table storage
                await tableClient.AddEntityAsync(tableEntity);

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
                log.LogError($"Error processing waitlist entry: {ex.Message}");
                return new ObjectResult(new WaitlistResponse
                {
                    Success = false,
                    Message = "An error occurred while processing your request.",
                    Data = null
                })
                {
                    StatusCode = StatusCodes.Status500InternalServerError
                };
            }
        }
    }
}
