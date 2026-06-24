namespace backend.Services
{
    public static class EmailTemplates
    {
        private static string Layout(string headerColor, string title, string bodyContent, string buttonText, int ticketId)
        {
            return $@"
            <div style='font-family: Arial, sans-serif; background-color:#f4f7fb; padding:30px;'>
                <div style='max-width:650px; margin:auto; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;'>

                    <div style='background-color:{headerColor}; color:white; padding:22px 28px;'>
                        <h1 style='margin:0; font-size:24px;'>SupportOps</h1>
                        <p style='margin:6px 0 0; font-size:14px;'>Enterprise IT Help Desk</p>
                    </div>

                    <div style='padding:28px; color:#111827;'>
                        <h2 style='margin-top:0;'>{title}</h2>

                        {bodyContent}

                        <a href='http://localhost:5173/tickets/{ticketId}'
                           style='display:inline-block; background-color:{headerColor}; color:white; padding:12px 20px; border-radius:10px; text-decoration:none; font-weight:bold;'>
                           {buttonText}
                        </a>

                        <p style='margin-top:28px;'>Regards,<br/><strong>SupportOps Team</strong></p>
                    </div>

                    <div style='background-color:#f9fafb; color:#6b7280; font-size:12px; padding:16px 28px; text-align:center;'>
                        This is an automated email from SupportOps. Please do not reply.
                    </div>
                </div>
            </div>";
        }

        public static string BuildTicketAssignedEmail(dynamic ticket, dynamic assignedUser)
        {
            var body = $@"
                <p>Hello <strong>{assignedUser.FullName}</strong>,</p>
                <p>A support ticket has been assigned to you. Please review the details below.</p>

                <div style='background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:18px; margin:22px 0;'>
                    <p><strong>Ticket Number:</strong> {ticket.TicketNumber}</p>
                    <p><strong>Title:</strong> {ticket.Title}</p>
                    <p><strong>Description:</strong> {ticket.Description}</p>
                    <p><strong>Status:</strong> Assigned</p>
                </div>";

            return Layout("#2563eb", "Ticket Assigned", body, "View Ticket", ticket.Id);
        }

        public static string BuildTicketStatusUpdatedEmail(dynamic ticket, dynamic ticketCreator, string oldStatusName, string newStatusName)
        {
            var body = $@"
                <p>Hello <strong>{ticketCreator.FullName}</strong>,</p>
                <p>Your support ticket status has been updated.</p>

                <div style='background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:18px; margin:22px 0;'>
                    <p><strong>Ticket Number:</strong> {ticket.TicketNumber}</p>
                    <p><strong>Title:</strong> {ticket.Title}</p>
                    <p><strong>Old Status:</strong> {oldStatusName}</p>
                    <p><strong>New Status:</strong> {newStatusName}</p>
                </div>";

            return Layout("#2563eb", "Ticket Status Updated", body, "View Ticket", ticket.Id);
        }

        public static string BuildTicketResolvedEmail(dynamic ticket, dynamic ticketCreator, string oldStatusName, string newStatusName)
        {
            var body = $@"
                <p>Hello <strong>{ticketCreator.FullName}</strong>,</p>
                <p>Good news! Your support ticket has been marked as resolved.</p>

                <div style='background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:18px; margin:22px 0;'>
                    <p><strong>Ticket Number:</strong> {ticket.TicketNumber}</p>
                    <p><strong>Title:</strong> {ticket.Title}</p>
                    <p><strong>Previous Status:</strong> {oldStatusName}</p>
                    <p><strong>Current Status:</strong> {newStatusName}</p>
                </div>";

            return Layout("#16a34a", "Ticket Resolved", body, "View Resolved Ticket", ticket.Id);
        }

        public static string BuildTicketCommentEmail(dynamic ticket, dynamic recipientUser, dynamic commentUser, string commentText)
{
    var body = $@"
        <p>Hello <strong>{recipientUser.FullName}</strong>,</p>
        <p><strong>{commentUser.FullName}</strong> added a new comment on a ticket.</p>

        <div style='background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:18px; margin:22px 0;'>
            <p><strong>Ticket Number:</strong> {ticket.TicketNumber}</p>
            <p><strong>Title:</strong> {ticket.Title}</p>
            <p><strong>Comment:</strong></p>
            <p style='background-color:#ffffff; border-left:4px solid #2563eb; padding:12px; margin:10px 0;'>
                {commentText}
            </p>
        </div>";

    return Layout("#2563eb", "New Comment Added", body, "View Ticket", ticket.Id);
}
    }
}