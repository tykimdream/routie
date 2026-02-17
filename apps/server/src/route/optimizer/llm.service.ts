import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RouteContext {
  routeType: string;
  placeCount: number;
  totalDuration: number;
  totalTravelTime: number;
  stops: {
    name: string;
    category: string;
    priority: string;
    duration: number;
  }[];
}

@Injectable()
export class LlmService {
  private readonly apiKey: string;
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') ?? '';
  }

  get isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async generateRouteReasoning(ctx: RouteContext): Promise<string> {
    if (!this.isAvailable) {
      return this.fallbackReasoning(ctx);
    }

    try {
      const prompt = `당신은 여행 경로 추천 전문가입니다. 다음 경로에 대해 왜 이 경로가 좋은지 2-3문장으로 한국어 설명을 작성해주세요.

경로 타입: ${this.typeLabel(ctx.routeType)}
방문 장소 수: ${ctx.placeCount}곳
총 소요시간: ${ctx.totalDuration}분
이동 시간: ${ctx.totalTravelTime}분

방문 순서:
${ctx.stops.map((s, i) => `${i + 1}. ${s.name} (${s.category}, ${s.priority}, ${s.duration}분 체류)`).join('\n')}

설명만 작성해주세요 (제목 없이):`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      const data = (await res.json()) as any;
      return (
        data.choices?.[0]?.message?.content?.trim() ??
        this.fallbackReasoning(ctx)
      );
    } catch (err) {
      this.logger.warn('LLM reasoning failed, using fallback', err);
      return this.fallbackReasoning(ctx);
    }
  }

  async generateStopReasons(
    stops: {
      name: string;
      category: string;
      priority: string;
      rating?: number;
    }[],
  ): Promise<string[]> {
    if (!this.isAvailable) {
      return stops.map((s) => this.fallbackStopReason(s));
    }

    try {
      const prompt = `각 장소의 방문 이유를 한 줄로 작성해주세요. JSON 배열로만 응답하세요.

장소:
${stops.map((s, i) => `${i + 1}. ${s.name} (${s.category}, 우선순위: ${s.priority}${s.rating ? `, 평점: ${s.rating}` : ''})`).join('\n')}

예시 형식: ["이유1", "이유2", ...]`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = (await res.json()) as any;
      const content: string = data.choices?.[0]?.message?.content?.trim() ?? '';
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length === stops.length) {
        return parsed;
      }
    } catch (err) {
      this.logger.warn('LLM stop reasons failed, using fallback', err);
    }

    return stops.map((s) => this.fallbackStopReason(s));
  }

  private fallbackReasoning(ctx: RouteContext): string {
    const typeLabel = this.typeLabel(ctx.routeType);
    const mustCount = ctx.stops.filter((s) => s.priority === 'MUST').length;
    return `${typeLabel} 경로로 총 ${ctx.placeCount}곳을 ${ctx.totalDuration}분 동안 방문합니다. ${mustCount > 0 ? `필수 장소 ${mustCount}곳이 포함되어 있으며, ` : ''}이동 시간 ${ctx.totalTravelTime}분으로 효율적인 동선입니다.`;
  }

  private fallbackStopReason(stop: {
    name: string;
    category: string;
    priority: string;
    rating?: number;
  }): string {
    const priorityText =
      stop.priority === 'MUST'
        ? '필수 방문 장소'
        : stop.priority === 'WANT'
          ? '추천 장소'
          : '선택 장소';
    return `${priorityText}${stop.rating ? ` (평점 ${stop.rating})` : ''}`;
  }

  private typeLabel(type: string): string {
    switch (type) {
      case 'EFFICIENT':
        return '효율 중심';
      case 'RELAXED':
        return '여유로운';
      case 'CUSTOM':
        return '맞춤형';
      default:
        return type;
    }
  }
}
