import { cn } from '@/lib/utils'
import { Check, Upload, BarChart3, Wand2, FileCode2 } from 'lucide-react'
import Link from 'next/link'

export type StepId = 'upload' | 'analyze' | 'refine' | 'compile'

interface Step {
  id: StepId
  label: string
  icon: React.ElementType
  href?: string
}

const steps: Step[] = [
  { id: 'upload', label: 'Upload', icon: Upload, href: '/resumes' },
  { id: 'analyze', label: 'Analyze', icon: BarChart3 },
  { id: 'refine', label: 'Refine', icon: Wand2 },
  { id: 'compile', label: 'Compile', icon: FileCode2 },
]

interface WorkflowStepperProps {
  currentStep: StepId
  resumeId?: string
}

export function WorkflowStepper({ currentStep, resumeId }: WorkflowStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="w-full py-4 mb-8">
      <div className="relative flex justify-between items-center max-w-3xl mx-auto">
        {/* Background track line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -z-10 -translate-y-1/2" />
        
        {/* Active progress line */}
        <div 
          className="absolute top-1/2 left-0 h-[2px] bg-violet-600 transition-all duration-500 ease-in-out -z-10 -translate-y-1/2" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const Icon = step.icon
          
          let StepContainer = 'div' as any
          let stepProps = {}
          
          // Make previous steps clickable if we have a resumeId
          if (isCompleted && step.id === 'upload') {
            StepContainer = Link
            stepProps = { href: '/resumes' }
          } else if (isCompleted && step.id === 'analyze' && resumeId) {
            StepContainer = Link
            stepProps = { href: `/resumes/${resumeId}/analyze` }
          }

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <StepContainer
                {...stepProps}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted 
                    ? "border-violet-600 bg-violet-600 text-white cursor-pointer hover:bg-violet-700" 
                    : isCurrent 
                    ? "border-violet-500 bg-slate-950 text-violet-400" 
                    : "border-slate-800 bg-slate-950 text-slate-600"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </StepContainer>
              <span 
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-violet-400" : isCompleted ? "text-slate-300" : "text-slate-600"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
