import { buildQuery, getNormalUsers } from '@/utils';
import { cookies } from 'next/headers'
import ComponentReadNormalUsers from '@/components/users/normal-users/components-read-normal-user'
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Normal Users List',
};

async function page({
    searchParams
}) {
    const access_token=cookies().get('access_token')?.value
    const refresh_token=cookies().get('token')?.value;
    
    let searchParamsMissing=false;
    if(!searchParams.skip || !searchParams.limit || !searchParams.role){
        searchParamsMissing=true
        if(!searchParams.skip) searchParams.skip=0
        if(!searchParams.limit) searchParams.limit=10
        if(!searchParams.role) searchParams.role='friend'
    }
    const queryString=buildQuery(searchParams)

    if(searchParamsMissing){
        redirect('app-users?'+queryString)
    }
    const normalUsersData=await getNormalUsers(`/user/api/admin/get-users-admin?${queryString}`,access_token,refresh_token)
    // console.log(normalUsersData.data.user,"normalUser");
    // if(normalUsersData?.data?.user && !Array.isArray(normalUsersData.data.user)) normalUsersData.data.user=[normalUsersData.data.user]
    // console.log(Array.isArray(normalUsersData.data.user))

    // console.log(normalUsersData.data.user,normalUsersData.success)
    // console.log(normalUsersData.data.user)
    return <div>
        <ComponentReadNormalUsers usersData={normalUsersData}/>
    </div>
}
export default page;
