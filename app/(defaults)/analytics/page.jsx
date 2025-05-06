import ComponentPartnerAnalytics from '@/components/dashboard/components-partner-analytics';
import { buildQuery, getPartnerAnalytics } from '@/utils';
import { cookies } from 'next/headers';

async function page ({
    searchParams
}){

    const access_token = cookies().get('access_token')?.value
    const refresh_token=cookies().get('token')?.value

    const queryString=buildQuery(searchParams)
    
    let analyticsData=await getPartnerAnalytics(`/analytics/api/admin/get-analytics?${queryString}`,access_token,refresh_token);
    let errorMessage='';
    if(analyticsData?.success===false){
        errorMessage=analyticsData?.message
    }

    let partners=analyticsData?.partners || {};
    let data=[];
    for (let key in partners) {
        const partner = partners[key];
        data.push({
            ...partner,
            partnerId: key,
            totalRevenueGenerated: (
                (+(partner.totalCallRevenueGenerated || 0).toFixed(2)) + 
                (+(partner.totalVideoRevenueGenerated || 0).toFixed(2))
            ).toFixed(2),
            totalEarnings: (
                (+(partner.totalCallEarnings || 0).toFixed(2)) + 
                (+(partner.totalVideoEarnings || 0).toFixed(2))
            ).toFixed(2),
            missedCallsPercent: partner.totalCalls 
                ? ((partner.totalMissedCalls / partner.totalCalls) * 100).toFixed(2) 
                : 0,
            conversionPercent: partner.totalCalls
                ? (((partner.convertedLeads + (partner.convertedLeadSelf || 0)) / partner.totalCalls) * 100).toFixed(2)
                : 0
        });
    }

    // analyticsData=analyticsData?.map((data)=>{
    //     let updatedData={...data}
    //     if(data.freeCallsCount==0) updatedData= {...updatedData,conversionPercent:-1}
    //     else updatedData= {...updatedData,conversionPercent:(data.convertedLeads/data.freeCallsCount*100).toFixed(2)}

    //     if(data.freeCallsCount===0 && data.paidCallsCount===0) updatedData= {...updatedData,missedCallsPercent:0}
    //     else updatedData= {...updatedData,missedCallsPercent:(data.missedCallsCount/(data.missedCallsCount+data.freeCallsCount+data.paidCallsCount)*100).toFixed(2)}
    //     return updatedData;
    // })
    console.log('analytics Data',data);
    return <ComponentPartnerAnalytics analyticsData={data} errorMessage={errorMessage}/>;
};

export default page;
