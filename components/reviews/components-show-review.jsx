'use client'

import { buildQuery, getPartnerReviews } from "@/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import sortBy from 'lodash/sortBy';
import Cookies from "universal-cookie";
import { DataTable } from "mantine-datatable";
import IconCaretDown from "../icon/icon-caret-down";

function ComponentShowReview({ partnerId }) {
    const [reviewsData, setReviewsData] = useState([]);
    const searchParams = useSearchParams();
    const [isLoading, setLoading] = useState(false);
    const cookies = new Cookies(null, { path: '/' })
    const [errorMessage,setErrorMessage]=useState(null);
    const [skip,setSkip]=useState(0);
    const limit=10;

    const fetchPartnerReviews=async()=>{
        try{
            setLoading(true);
            const from = searchParams.get('from') || '';
            const to = searchParams.get('to') || '';
            const queryString = buildQuery({ from, to, skip, limit, partnerId });
            const access_token = cookies.get('access_token');
            const res=await getPartnerReviews('/user/api/admin/get-reviews-admin?' + queryString, access_token)

            setReviewsData(res?.data?.reviews);
        }catch(err){
            console.error(err);
            setErrorMessage(err);
            setReviewsData([]);
        }
        finally{
            setLoading(false)
        };

    }

    useEffect(() => {
        fetchPartnerReviews();
    }, [partnerId, searchParams,skip])


    return (
            <div>
                <DataTable
                    noRecordsText="No results match your search query"
                    // highlightOnHover
                    className="table-hover whitespace-nowrap"
                    records={reviewsData}
                    columns={
                        [
                            {
                                accessor: '_id',
                                title: 'Sender Id',
                                render: ({ _id }) => <div className="flex items-center gap-2 font-bold">{_id}</div>
                            },
                            {
                                accessor: 'message',
                                title: 'Message',
                                render: ({ message }) => <div className="flex items-center gap-2 font-bold">{message}</div>,
                            },
                            {
                                accessor: 'rating',
                                title: 'Rating',
                                render: ({ rating }) => (
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold">{rating}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'isReport',
                                title: 'Is Report',
                                render: ({ isReport }) => <div className="flex items-center gap-2">
                                    <strong className="font-bold">{isReport}</strong>
                                </div>,
                            }
                        ]
                    }
                    idAccessor='_id'
                    fetching={isLoading}                    
                    minHeight={200}
                    emptyState={errorMessage ? <div>{errorMessage}</div> : <div>No records Found</div>}
                />

                {/* For pagination */}
                <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse m-auto mt-4">
                            {/* Prev button */}
                            <li>
                            <button
                                type="button"
                                className={`flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${skip === 0 && 'cursor-not-allowed hover:bg-primary-light'}`}
                                onClick={() => {
                                    setSkip(skip-10);
                                }}
                                disabled={skip===0}
                            >
                                <IconCaretDown className="h-5 w-5 rotate-90 rtl:-rotate-90" />
                            </button>
                        </li>

                            {/* Next Button */}
                            <li>
                            <button
                                type="button"
                                className={`flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${reviewsData?.length < 10 && 'cursor-not-allowed hover:bg-primary-light'}`}
                                onClick={() => {
                                    setSkip(skip+10);
                                    fetchPartnerReviews();
                                }}
                                disabled={reviewsData?.length < 10}
                            >
                                <IconCaretDown className="h-5 w-5 -rotate-90 rtl:rotate-90" />
                            </button>
                        </li>
                        </ul>
            </div>
    );
}

export default ComponentShowReview;