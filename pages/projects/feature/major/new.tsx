import Button from "@/components/common/Button";
import { Profile } from "@/models/me/Profile";
import { MajorFeature } from "@/models/projects/MajorFeature";
import { Project } from "@/models/projects/Project";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import Image from "next/image";
import { MinorFeature } from "@/models/projects/MinorFeature";
import { MinorFeatureBox } from "@/components/projects/FeatureBoxes";

interface MajorFeatureProps
{
    projectId: string;
	projectName: string;
    user: User;
	profiles: Profile[];
}

export default function NewMajorFeature({ user, projectName, projectId, profiles }: MajorFeatureProps)
{
    const router = useRouter();
    const [unsavedChanges, setUnsavedChanges] = useState(false);
	const [majorFeature, setMajorFeature] = useState(new MajorFeature());
	const [staffInvolved, setStaffInvolved] = useState<string[]>([]);
	const [minorFeatures, setMinorFeatures] = useState<MinorFeature[]>([]);

    return <div className='w-full h-full min-h-full flex flex-col items-center justify-start gap-4 max-w-[1920px] p-8 mx-auto'>
        <div className="w-full flex flex-row items-center justify-between">
            <Button text={`Back to ${projectName}`} onClick={() => {
                router.push(`/projects/${projectId}`);
            }} className="mr-auto" />
			<Button text='Create Major Feature' onClick={async () => 
			{
                
            }} className="" />
        </div>
		<div className="w-full flex flex-row gap-8">
			<div className="flex-grow w-1/2 flex flex-col gap-2 min-h-full">
				<span>Create A New Major Feature for <b>{projectName}</b></span>
				<input value={majorFeature.name} onChange={(e) => setMajorFeature({...majorFeature, name: e.target.value})} className="p-2 bg-tertiary font-medium w-full rounded outline-none" placeholder="Feature Name" />
				<div className="flex flex-row gap-2">
					<textarea value={majorFeature.description} onChange={(e) => setMajorFeature({...majorFeature, description: e.target.value})} className="p-2 bg-tertiary font-medium w-1/2 rounded h-80 outline-none" placeholder="Feature Description" />
					<textarea value={majorFeature.objective} onChange={(e) => setMajorFeature({...majorFeature, objective: e.target.value})} className="p-2 bg-tertiary font-medium w-1/2 rounded h-80 outline-none" placeholder="Objective" />
				</div>
			</div>
			<div className="flex-grow w-1/2 flex flex-col gap-2 min-h-full">
				<span>Staff Involved In This Feature</span>
				<div className="flex-grow flex flex-row gap-4">
					{
                        profiles.map(profile => <button className="h-80 w-64 mb-10 flex text-left" 
                        onClick={() => {
                            if (staffInvolved.some(x => x === profile.id))
                                setStaffInvolved(staffInvolved.filter(x => x !== profile.id));
                            else
                                setStaffInvolved(staffInvolved => [...staffInvolved, profile.id]);
                        }}>
                            <div className="group w-full h-full rounded bg-tertiary text-zinc-100 font-medium hover:cursor-pointer flex flex-col">
                                <Image 
                                priority={true}
                                src={profile.profilePictureURL} 
                                alt='profile' 
                                width='600' height='400' 
                                className="object-cover rounded-t-sm w-full min-w-[256px] min-h-[320px]"  />
                                <div className="p-2 flex flex-col gap-2 bg-tertiary rounded-b transition group-hover:bg-primary group-hover:text-secondary aria-selected:bg-primary aria-selected:text-secondary"
                                aria-selected={staffInvolved.some(x => x === profile.id)}>
                                    <p className="text-lg font-medium">{profile.name}</p>
                                    <span>{profile.role}</span>
                                </div>
                            </div>
                        </button>
                        )
                    }
				</div>
			</div>
		</div>
		<div className="flex flex-col w-full items-center">
			<div className="w-full flex flex-row items-center gap-4">
				<span className="">Minor Features</span>
				<Button text='Add Minor Feature' onClick={() => {
					const newMinorFeature = new MinorFeature();
					newMinorFeature.majorFeatureId = majorFeature.id;
					newMinorFeature.staffInvolved = majorFeature.peopleInvolved;
					setMinorFeatures(minorFeatures => [...minorFeatures, newMinorFeature]);
				}} />
			</div>
			<span className="w-full">A minor feature is an isolated component that is required to make the major feature work. A small part of a bigger picture.</span>
		</div>
		<div className="w-full flex flex-row flex-wrap gap-2 pb-10">
			{
				minorFeatures.map(feature => <MinorFeatureBox feature={feature} />)
			}
		</div>
    </div>
}


export const getServerSideProps = async (context: GetServerSidePropsContext) =>
{
	const supabaseClient = createServerSupabaseClient(context);
	const { data: { session }} = await supabaseClient.auth.getSession();
	if (!session)
	{
		return {
			redirect: {
				destination: '/sign-in',
				permanent: false
			}
		}
	}

	const project = (await supabaseClient.from('projects').select('id, name, peopleInvolved').eq('id', context.query['id']).single()).data as Project;
	const staffInvolved = (await supabaseClient.from('profiles').select('*').in('id', project.peopleInvolved)).data as Profile[];
	for (const profile of staffInvolved)
	{
		profile.profilePictureURL = supabaseClient.storage.from('profile.pictures').getPublicUrl(profile.profilePictureURL).data.publicUrl;
	}
	return {
		props: {
			user: session?.user ?? null,
			projectName: project.name,
            projectId: project.id,
			profiles: staffInvolved,
		}
	}
}