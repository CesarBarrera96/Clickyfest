using System.Collections.Generic;

namespace ClickyFest.Api.DTOS
{
    // Item básico para actualizar órdenes en bloque
    public class ReorderItemDto
    {
        public int ProductId { get; set; }
        public int Order { get; set; }
    }

    // Opcional: request envoltorio si se quisiera, no es requerido por ahora
    public class ReorderRequestDto
    {
        public List<ReorderItemDto> Items { get; set; } = new();
    }
}