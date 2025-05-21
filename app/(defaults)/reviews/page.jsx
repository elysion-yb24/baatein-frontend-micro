// import PartnerReviewsComponent from "@/components/dashboard/components-review";
import AllReviewsComponent from '@/components/reviews/components-reviews-page';
import { buildQuery, get } from "@/utils";
import { cookies } from 'next/headers';

async function page({searchParams}){
    const access_token = cookies().get('access_token')?.value
    const refresh_token=cookies().get('token')?.value
    const query=buildQuery(searchParams);

    const reviewsList=await get(`/analytics/api/admin/get-all-reviews?${query}`,access_token,refresh_token);
    return <AllReviewsComponent reviewsList={reviewsList} searchParams={searchParams}/>;
}

export default page;