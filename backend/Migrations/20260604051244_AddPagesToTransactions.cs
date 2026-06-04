using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintTrackPro.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPagesToTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Pages",
                table: "Transactions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Pages",
                table: "Transactions");
        }
    }
}
