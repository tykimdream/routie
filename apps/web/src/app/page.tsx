import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  MapPinIcon,
  RouteIcon,
  SparklesIcon,
  ClockIcon,
  PlaneIcon,
  CompassIcon,
  ArrowRightIcon,
  StarIcon,
} from '@/components/icons';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-sand-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[8px] flex items-center justify-center">
              <CompassIcon size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-sand-800">Routie</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">시작하기</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-600 font-medium mb-8">
              <SparklesIcon size={16} />
              <span>여행 경로 최적화 서비스</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sand-900 leading-tight tracking-tight mb-6">
              가고 싶은 곳은 많은데
              <br />
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                어디부터 갈지
              </span>{' '}
              고민이라면
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-sand-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              Routie가 장소의 위치, 영업시간, 이동 시간을 고려해서
              <br className="hidden sm:block" />
              최적의 여행 경로를 만들어드려요
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  무료로 시작하기
                  <ArrowRightIcon size={20} />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg">
                  어떻게 작동하나요?
                </Button>
              </Link>
            </div>

            {/* Hero Visual — Mock Route Card */}
            <div className="relative max-w-2xl mx-auto">
              <div className="bg-white rounded-[16px] shadow-lg border border-sand-200 p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <PlaneIcon size={20} className="text-primary-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sand-800">방콕 3일 여행</p>
                    <p className="text-sm text-sand-400">
                      12개 장소 · 최적 경로 생성 완료
                    </p>
                  </div>
                </div>

                {/* Mini Timeline */}
                <div className="space-y-0">
                  {[
                    {
                      time: '10:00',
                      name: '왓포 사원',
                      tag: '관광',
                      color: 'bg-secondary-100 text-secondary-700',
                      dot: 'bg-secondary-500',
                    },
                    {
                      time: '12:15',
                      name: '제이옥 레스토랑',
                      tag: '점심',
                      color: 'bg-primary-100 text-primary-700',
                      dot: 'bg-primary-500',
                    },
                    {
                      time: '14:30',
                      name: '블루 웨일 카페',
                      tag: '카페',
                      color: 'bg-accent-100 text-accent-700',
                      dot: 'bg-accent-500',
                    },
                    {
                      time: '16:00',
                      name: '아이콘시암',
                      tag: '쇼핑',
                      color: 'bg-purple-100 text-purple-700',
                      dot: 'bg-purple-500',
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${item.dot} ring-4 ring-white z-10`}
                        />
                        {i < 3 && <div className="w-0.5 h-12 bg-sand-200" />}
                      </div>
                      <div className="flex-1 pb-4 -mt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-sand-400">
                            {item.time}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.color}`}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <p className="font-medium text-sand-800 text-sm">
                          {item.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative blobs */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent-200 rounded-full opacity-40 blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary-200 rounded-full opacity-40 blur-xl" />
              <div className="absolute top-1/2 -right-8 w-16 h-16 bg-secondary-200 rounded-full opacity-40 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-sand-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-sand-900 mb-4">
              3단계로 완성하는 여행 경로
            </h2>
            <p className="text-lg text-sand-500 max-w-xl mx-auto">
              복잡한 계획은 Routie에게 맡기고, 여행의 설렘에만 집중하세요
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <MapPinIcon size={28} className="text-primary-500" />,
                title: '장소 추가',
                description:
                  '가고 싶은 장소를 검색하고 추가하세요. 구글 지도에서 저장한 장소도 한 번에 가져올 수 있어요.',
                bgColor: 'bg-primary-50',
              },
              {
                step: '02',
                icon: <StarIcon size={28} className="text-accent-500" />,
                title: '우선순위 설정',
                description:
                  '"이 곳은 꼭 가야 해!" 하는 장소엔 필수 태그를, 나머지는 선호나 옵션으로 자유롭게 설정하세요.',
                bgColor: 'bg-accent-50',
              },
              {
                step: '03',
                icon: <RouteIcon size={28} className="text-secondary-500" />,
                title: '최적 경로 확인',
                description:
                  '이동 시간, 영업시간, 우선순위를 모두 고려한 2~3개의 맞춤 경로를 추천받으세요.',
                bgColor: 'bg-secondary-50',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-[16px] p-8 shadow-sm border border-sand-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 ${item.bgColor} rounded-[12px] flex items-center justify-center mb-6`}
                >
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-primary-400 mb-2">
                  STEP {item.step}
                </div>
                <h3 className="text-xl font-bold text-sand-800 mb-3">
                  {item.title}
                </h3>
                <p className="text-sand-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-sand-900 mb-4">
              왜 Routie인가요?
            </h2>
            <p className="text-lg text-sand-500">
              단순한 경로 찾기가 아닌, 여행 의사결정을 돕는 서비스
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: <SparklesIcon size={22} />,
                title: '스마트 경로 추천',
                description:
                  '이동 시간, 영업시간, 체류 시간까지 고려해서 효율/여유/맞춤 3가지 경로를 추천해요.',
                accent: 'text-primary-500 bg-primary-50',
              },
              {
                icon: <ClockIcon size={22} />,
                title: '시간을 아끼는 동선',
                description:
                  '장소 간 실제 이동 시간 데이터를 기반으로 동선 낭비를 최소화해요.',
                accent: 'text-secondary-500 bg-secondary-50',
              },
              {
                icon: <StarIcon size={22} />,
                title: '우선순위 반영',
                description:
                  '"꼭 갈 곳"은 반드시 포함하고, 나머지는 동선에 맞춰 자동 배치해요.',
                accent: 'text-accent-500 bg-accent-50',
              },
              {
                icon: <MapPinIcon size={22} />,
                title: '장소별 의사결정 지원',
                description:
                  '평점, 리뷰 하이라이트, 시그니처 메뉴까지 한눈에 비교하고 결정하세요.',
                accent: 'text-purple-500 bg-purple-50',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex gap-5 p-6 rounded-[12px] bg-white border border-sand-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div
                  className={`w-12 h-12 rounded-[10px] flex-shrink-0 flex items-center justify-center ${feature.accent}`}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sand-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sand-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-primary-500 via-primary-400 to-accent-400 rounded-[24px] p-10 sm:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                다음 여행, Routie와 함께 준비하세요
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                가고 싶은 곳을 추가하고 최적 경로를 받아보세요.
                <br />
                복잡한 계획은 Routie가 해결해드립니다.
              </p>
              <Link href="/signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white text-primary-600 border-white hover:bg-white/90 hover:text-primary-700"
                >
                  무료로 시작하기
                  <ArrowRightIcon size={20} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-sand-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[6px] flex items-center justify-center">
              <CompassIcon size={14} className="text-white" />
            </div>
            <span className="font-bold text-sand-700">Routie</span>
          </div>
          <p className="text-sm text-sand-400">
            &copy; 2026 Routie. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
