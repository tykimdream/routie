import { z } from 'zod';

export const createTripSchema = z
  .object({
    title: z.string().min(1, '여행 이름을 입력해주세요'),
    city: z.string().min(1, '도시를 입력해주세요'),
    country: z.string().optional(),
    startDate: z.string().min(1, '출발일을 선택해주세요'),
    endDate: z.string().min(1, '귀국일을 선택해주세요'),
    dailyStart: z.string().default('10:00'),
    dailyEnd: z.string().default('21:00'),
    transport: z
      .enum(['PUBLIC_TRANSIT', 'WALKING', 'DRIVING', 'TAXI'])
      .default('PUBLIC_TRANSIT'),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: '귀국일은 출발일 이후여야 합니다',
    path: ['endDate'],
  });

export type CreateTripFormData = z.infer<typeof createTripSchema>;
