using backend.Data;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text;
namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("overview")]
        public IActionResult GetOverview()
        {
            var totalTickets = _context.Tickets.Count();
            var openTickets = _context.Tickets.Count(t => t.StatusId == 1);
            var pendingTickets = _context.Tickets.Count(t => t.StatusId == 3);
            var resolvedTickets = _context.Tickets.Count(t => t.StatusId == 4);
            var closedTickets = _context.Tickets.Count(t => t.StatusId == 5);

            return Ok(new
            {
                totalTickets,
                openTickets,
                pendingTickets,
                resolvedTickets,
                closedTickets
            });
        }


        [HttpGet("ticket-volume")]
public IActionResult GetTicketVolume()
{
    var data = _context.Tickets
        .GroupBy(t => t.CreatedAt.Date)
        .Select(group => new
        {
            date = group.Key,
            count = group.Count()
        })
        .OrderBy(item => item.date)
        .ToList();

    return Ok(data);
}


[HttpGet("resolution-time")]
public IActionResult GetResolutionTime()
{
    var resolvedTickets = _context.Tickets
        .Where(t => t.ResolvedAt != null)
        .ToList();

    if (resolvedTickets.Count == 0)
    {
        return Ok(new
        {
            averageResolutionHours = 0
        });
    }

    var averageHours = resolvedTickets
        .Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours);

    return Ok(new
    {
        averageResolutionHours = Math.Round(averageHours, 2)
    });
}


[HttpGet("team-performance")]
public IActionResult GetTeamPerformance()
{
    var agents = _context.Users
        .Where(u => u.Role == "IT Support Agent")
        .Select(agent => new
        {
            agentId = agent.Id,
            fullName = agent.FullName,
            resolvedTickets = _context.Tickets.Count(t =>
                t.AssignedToUserId == agent.Id &&
                (t.StatusId == 4 || t.StatusId == 5)
            ),
            activeTickets = _context.Tickets.Count(t =>
                t.AssignedToUserId == agent.Id &&
                t.StatusId != 4 &&
                t.StatusId != 5
            )
        })
        .OrderByDescending(a => a.resolvedTickets)
        .ToList();

    return Ok(agents);
}



[HttpGet("tickets-by-category")]
public IActionResult GetTicketsByCategory()
{
    var data = _context.Categories
        .Select(category => new
        {
            category = category.Name,
            count = _context.Tickets.Count(t => t.CategoryId == category.Id)
        })
        .ToList();

    return Ok(data);
}

[HttpGet("tickets-by-priority")]
public IActionResult GetTicketsByPriority()
{
    var data = _context.Priorities
        .Select(priority => new
        {
            priority = priority.Name,
            count = _context.Tickets.Count(t => t.PriorityId == priority.Id)
        })
        .ToList();

    return Ok(data);
}

[HttpGet("tickets-by-status")]
public IActionResult GetTicketsByStatus()
{
    var data = _context.Statuses
        .Select(status => new
        {
            status = status.Name,
            count = _context.Tickets.Count(t => t.StatusId == status.Id)
        })
        .ToList();

    return Ok(data);
}
[HttpGet("export-csv")]
public IActionResult ExportTicketsCsv()
{
    var tickets = _context.Tickets
        .OrderByDescending(t => t.CreatedAt)
        .ToList();

    var csv = new StringBuilder();

    csv.AppendLine("Ticket Number,Title,Created By,Assigned To,Category,Priority,Status,Created Date");

    foreach (var ticket in tickets)
    {
        var createdBy = _context.Users.FirstOrDefault(u => u.Id == ticket.CreatedByUserId)?.FullName ?? "Unknown";
        var assignedTo = ticket.AssignedToUserId != null
            ? _context.Users.FirstOrDefault(u => u.Id == ticket.AssignedToUserId)?.FullName ?? "Unassigned"
            : "Unassigned";

        var category = _context.Categories.FirstOrDefault(c => c.Id == ticket.CategoryId)?.Name ?? "Unknown";
        var priority = _context.Priorities.FirstOrDefault(p => p.Id == ticket.PriorityId)?.Name ?? "Unknown";
        var status = _context.Statuses.FirstOrDefault(s => s.Id == ticket.StatusId)?.Name ?? "Unknown";

        csv.AppendLine($"{ticket.TicketNumber},\"{ticket.Title}\",\"{createdBy}\",\"{assignedTo}\",\"{category}\",\"{priority}\",\"{status}\",{ticket.CreatedAt}");
    }

    var bytes = Encoding.UTF8.GetBytes(csv.ToString());

    return File(bytes, "text/csv", "ticket-report.csv");
}

[HttpGet("export-pdf")]
public IActionResult ExportTicketsPdf()
{
    QuestPDF.Settings.License = LicenseType.Community;

    var totalTickets = _context.Tickets.Count();
    var openTickets = _context.Tickets.Count(t => t.StatusId == 1);
    var pendingTickets = _context.Tickets.Count(t => t.StatusId == 3);
    var resolvedTickets = _context.Tickets.Count(t => t.StatusId == 4);
    var closedTickets = _context.Tickets.Count(t => t.StatusId == 5);

    var resolvedTicketRows = _context.Tickets
        .Where(t => t.ResolvedAt != null)
        .ToList();

    var averageResolutionHours = resolvedTicketRows.Count == 0
        ? 0
        : Math.Round(resolvedTicketRows.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours), 2);

    var teamPerformance = _context.Users
        .Where(u => u.Role == "IT Support Agent")
        .Select(agent => new
        {
            agent.FullName,
            ResolvedTickets = _context.Tickets.Count(t =>
                t.AssignedToUserId == agent.Id &&
                (t.StatusId == 4 || t.StatusId == 5)
            ),
            ActiveTickets = _context.Tickets.Count(t =>
                t.AssignedToUserId == agent.Id &&
                t.StatusId != 4 &&
                t.StatusId != 5
            )
        })
        .OrderByDescending(a => a.ResolvedTickets)
        .ToList();

    var generatedAt = DateTime.Now;

    var pdfBytes = Document.Create(container =>
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(36);
            page.DefaultTextStyle(text => text.FontSize(10).FontColor(Colors.Grey.Darken3));

            page.Header().Column(column =>
            {
                column.Item().Text("SupportOps Ticket Report")
                    .SemiBold()
                    .FontSize(22)
                    .FontColor(Colors.Blue.Darken2);

                column.Item().Text($"Generated date: {generatedAt:MMM dd, yyyy h:mm tt}")
                    .FontSize(10)
                    .FontColor(Colors.Grey.Darken1);
            });

            page.Content().PaddingTop(22).Column(column =>
            {
                column.Spacing(18);

                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    MetricCard(table, "Total Tickets", totalTickets.ToString("N0"));
                    MetricCard(table, "Open Tickets", openTickets.ToString("N0"));
                    MetricCard(table, "Pending Tickets", pendingTickets.ToString("N0"));
                    MetricCard(table, "Resolved Tickets", resolvedTickets.ToString("N0"));
                    MetricCard(table, "Closed Tickets", closedTickets.ToString("N0"));
                    MetricCard(table, "Average Resolution Time", $"{averageResolutionHours:N2} hours");
                });

                column.Item().Text("Team Performance")
                    .SemiBold()
                    .FontSize(14)
                    .FontColor(Colors.Grey.Darken4);

                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.ConstantColumn(105);
                        columns.ConstantColumn(95);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(TableHeaderCell).Text("Agent Name");
                        header.Cell().Element(TableHeaderCell).AlignRight().Text("Resolved Tickets");
                        header.Cell().Element(TableHeaderCell).AlignRight().Text("Active Tickets");
                    });

                    if (teamPerformance.Count == 0)
                    {
                        table.Cell().ColumnSpan(3).Element(TableBodyCell).Text("No team performance data available.");
                    }
                    else
                    {
                        foreach (var agent in teamPerformance)
                        {
                            table.Cell().Element(TableBodyCell).Text(agent.FullName ?? "Unnamed agent");
                            table.Cell().Element(TableBodyCell).AlignRight().Text(agent.ResolvedTickets.ToString("N0"));
                            table.Cell().Element(TableBodyCell).AlignRight().Text(agent.ActiveTickets.ToString("N0"));
                        }
                    }
                });
            });

            page.Footer().AlignRight().Text(text =>
            {
                text.Span("Page ");
                text.CurrentPageNumber();
                text.Span(" of ");
                text.TotalPages();
            });
        });
    }).GeneratePdf();

    return File(pdfBytes, "application/pdf", "ticket-report.pdf");

    static void MetricCard(TableDescriptor table, string label, string value)
    {
        table.Cell()
            .Padding(5)
            .Border(1)
            .BorderColor(Colors.Grey.Lighten2)
            .Background(Colors.Grey.Lighten5)
            .Padding(10)
            .Column(column =>
            {
                column.Spacing(4);
                column.Item().Text(label).FontSize(9).FontColor(Colors.Grey.Darken1);
                column.Item().Text(value).SemiBold().FontSize(15).FontColor(Colors.Grey.Darken4);
            });
    }

    static IContainer TableHeaderCell(IContainer container)
    {
        return container
            .Background(Colors.Grey.Lighten4)
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(7)
            .PaddingHorizontal(8);
    }

    static IContainer TableBodyCell(IContainer container)
    {
        return container
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten3)
            .PaddingVertical(7)
            .PaddingHorizontal(8);
    }
}
    }
}
