using Microsoft.EntityFrameworkCore;
using ClickyFest.Api.Data;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ClickyFest.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURACIÓN DE CORS (INICIO) ---
// Aquí creamos nuestra "lista de invitados VIP"
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Permite solo a tu app de Angular
              .AllowAnyHeader()                     // Permite que envíe cualquier tipo de encabezado
              .AllowAnyMethod();                    // Permite que use cualquier método (GET, POST, PUT, DELETE)
    });
});
// --- CONFIGURACIÓN DE CORS (FIN) ---


// --- Conexión a la Base de Datos ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ClickyFestDbContext>(options =>
    options.UseSqlServer(connectionString));


// Add services to the container.
// Program.cs

// Reemplaza builder.Services.AddControllers(); con esto:
builder.Services.AddControllers().AddJsonOptions(options =>
{
    // 1. Convierte los nombres de propiedad a camelCase (buena práctica)
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    
    // 2. Ignora los ciclos de referencia para evitar el error 500
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("La clave JWT no está configurada en appsettings.json");
}

// --- Configuración de Autenticación JWT ---
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
// --- Fin de Configuración de Autenticación JWT ---


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<ClickyFest.Api.Services.ImageUploadService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // Enable serving of static files

// --- HABILITAR CORS (MIDDLEWARE) ---
// Aquí le damos la "lista de invitados" al portero
app.UseCors("AllowAngularApp");
// --- FIN DEL MIDDLEWARE DE CORS ---

// --- Habilitar Autenticación y Autorización ---
app.UseAuthentication();
app.UseAuthorization();
// --- Fin de Autenticación y Autorización ---

app.MapControllers();

app.Run();
