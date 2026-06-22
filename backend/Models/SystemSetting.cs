namespace backend.Models
{
    public class SystemSetting
    {
        public int Id { get; set; }

        public string ApplicationName { get; set; } = "SupportOps";

        public string SupportEmail { get; set; } = "support@company.com";

        public string DefaultPriority { get; set; } = "Medium";

        public bool EmailNotificationsEnabled { get; set; } = false;

        public bool MaintenanceMode { get; set; } = false;

        public int SessionTimeoutHours { get; set; } = 2;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}