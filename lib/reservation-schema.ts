import { z } from "zod";

// A same-day-to-2-years-out window covers every legitimate reservation;
// anything outside it is a malformed or mistyped date input, not a real booking.
const MAX_RESERVATION_YEAR = new Date().getFullYear() + 2;

export const reservationSchema = z.object({
  nombre: z.string().trim().min(1, "Contanos tu nombre para la reserva."),
  telefono: z.string().trim().min(1, "Necesitamos un teléfono de contacto."),
  personas: z.string().min(1, "Indicá para cuántas personas es la mesa."),
  fecha: z
    .string()
    .min(1, "Elegí una fecha.")
    .refine((value) => {
      const match = /^(\d{4})-\d{2}-\d{2}$/.exec(value);
      if (!match) return false;
      const year = Number(match[1]);
      return (
        year <= MAX_RESERVATION_YEAR && !Number.isNaN(new Date(value).getTime())
      );
    }, "Esa fecha no es válida."),
  hora: z.string().min(1, "Elegí un horario."),
  comentarios: z.string().optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export const PARTY_SIZES = ["1", "2", "3", "4", "5", "6", "7", "8+"];
