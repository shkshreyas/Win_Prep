import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user?.id || ""),
    getLatestInterviews({ userId: user?.id || "" }),
  ]);

  const hasPastInterviews = userInterviews && userInterviews.length > 0;
  const hasUpcomingInterviews = allInterview && allInterview.length > 0;

  return (
    <>
      <section className="grid gap-8 md:grid-cols-2 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            WinPrep: Real-time AI interview practice
          </h1>
          <p className="text-muted-foreground">
            Speak with an AI interviewer, analyze your resume, and study the
            latest web-sourced questions. Dark or light—your choice.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="btn-primary">
              <Link href="/interview">Start voice interview</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/setup">Prepare with resume</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/questions">Latest questions</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
          <Image
            src="/robot.png"
            alt="AI"
            width={640}
            height={480}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-12">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-12">
        <h2>Take Interviews</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            allInterview?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-12">
        <h2>Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/setup"
            className="group rounded-xl border border-border/50 bg-card p-5 hover:bg-accent hover:text-white animate-fadeIn"
          >
            <div className="font-semibold mb-1 group-hover:text-white">
              Resume Analysis
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-white">
              Paste your resume text to get AI insights and predicted questions.
            </p>
          </Link>
          <Link
            href="/questions"
            className="group rounded-xl border border-border/50 bg-card p-5 hover:bg-accent hover:text-white animate-fadeIn"
          >
            <div className="font-semibold mb-1 group-hover:text-white">
              Latest Questions
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-white">
              Browse role/company interview questions from the web.
            </p>
          </Link>
          <Link
            href="/interview"
            className="group rounded-xl border border-border/50 bg-card p-5 hover:bg-accent hover:text-white animate-fadeIn"
          >
            <div className="font-semibold mb-1 group-hover:text-white">
              Voice Interview
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-white">
              Practice in a real-time voice conversation with AI.
            </p>
          </Link>
          <Link
            href="/analytics"
            className="group rounded-xl border border-border/50 bg-card p-5 hover:bg-accent hover:text-white animate-fadeIn"
          >
            <div className="font-semibold mb-1 group-hover:text-white">
              Analytics
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-white">
              Track scores, strengths, and interview readiness (stub).
            </p>
          </Link>
          <Link
            href="/peer"
            className="group rounded-xl border border-border/50 bg-card p-5 hover:bg-accent hover:text-white animate-fadeIn"
          >
            <div className="font-semibold mb-1 group-hover:text-white">
              Peer Mock
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-white">
              Create or join a room to practice with peers (stub).
            </p>
          </Link>
          <Link
            href="/plan"
            className="group rounded-xl border border-border/50 bg-card p-5 hover:bg-accent hover:text-white animate-fadeIn"
          >
            <div className="font-semibold mb-1 group-hover:text-white">
              Weekly Plan
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-white">
              Get a 7-day AI prep plan based on your goals (stub).
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}

export default Home;
