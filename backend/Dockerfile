FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["PrintTrackPro.Backend.csproj", "./"]
RUN dotnet restore "PrintTrackPro.Backend.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "PrintTrackPro.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "PrintTrackPro.Backend.dll"]
