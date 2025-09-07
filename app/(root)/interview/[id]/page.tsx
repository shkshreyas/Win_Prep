import Image from "next/image";
import { redirect } from "next/navigation";

import Interview from "@/components/Interview";
import VideoRoom from "@/components/VideoRoom";
import { getCompanyLogo } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";

interface RouteParams {
  params: {
    id: string;
  };
}

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const _feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  const roomName = `interview-${id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getCompanyLogo(interview.company)}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize">
              {interview.role} Interview{" "}
              {interview.company ? `· ${interview.company}` : ""}
            </h3>
          </div>

          <DisplayTechIcons techStack={interview.techstack} />
        </div>

        <p className="bg-dark-200 text-white px-4 py-2 rounded-lg h-fit">
          {interview.type}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="w-full aspect-video bg-dark-200 rounded-lg overflow-hidden">
          <VideoRoom userName={user.name || "Candidate"} roomName={roomName} />
        </div>

        <div className="w-full">
          <Interview
            userName={user.name || "Guest"}
            userId={user.id}
            interviewId={id}
            questions={interview.questions}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewDetails;
