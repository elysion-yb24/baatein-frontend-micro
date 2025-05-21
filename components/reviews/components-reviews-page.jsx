'use client'
import { DataTable } from "mantine-datatable";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import sortBy from "lodash/sortBy";
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { useSelector } from "react-redux";
import ComponentShowReview from "@/components/reviews/components-show-review";

function ComponentAllReviews({reviewsList}) {
    const [partnerId,setPartnerId]=useState(null);
    const [isLoading, setLoading] = useState(false)
    const [initialRecords, setInitialRecords] = useState(reviewsList?.data || []);
    const searchParams=useSearchParams();
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const [formData, setFormData] = useState({
        from: searchParams.get('from') || '',
        to: searchParams.get('to') || '',
    })
    const { push, refresh } = useRouter();
    const pathname = usePathname();
    const handleQuery = (paramsFormData) => {
        try {
            setLoading(true)
            const params = new URLSearchParams(searchParams)
            for (let key in paramsFormData) {
                params.set(key, paramsFormData[key])
            }
            push(`${pathname}?${params.toString()}`, { scroll: false })
            refresh()
            setTimeout(() => {
                setLoading(false)
            }, 1000)
        } catch (err) {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedFormData = { ...formData }
        handleQuery(updatedFormData);
    }
    const [sortStatus, setSortStatus] = useState({
        columnAccessor: 'id',
        direction: 'asc',
    });


    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setInitialRecords(reviewsList?.data || [])
        setFormData({
            from: searchParams.get('from') || '',
            to: searchParams.get('to') || '',
        })
    }, [searchParams])

    useEffect(() => {
        setIsMounted(true);
    }, []);


    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.sort(function (a, b) { return b[sortStatus.columnAccessor] - a[sortStatus.columnAccessor] }) : data.sort(function (a, b) { return a[sortStatus.columnAccessor] - b[sortStatus.columnAccessor] }));
    }, [sortStatus]);

    return (
        <>
            {/* Records Table */}
            <div className="panel mt-6">

                {/* Search Queries */}
                <form className="mx-auto w-full mb-5" onSubmit={handleSubmit}>
                    <div className=' grid sm:grid-cols-2 md:grid-cols-3 gap-4'>

                        {/* Date Picker */}
                        <div>
                            <label>Date</label>
                            <Flatpickr
                                options={{
                                    mode: 'range',
                                    dateFormat: 'Y-m-d',
                                    position: isRtl ? 'auto right' : 'auto left',
                                }}
                                defaultValue={`${searchParams.get('from')} to ${searchParams.get('to')}`}
                                className="form-input"

                                onChange={(selectedDates) => {
                                    if (selectedDates.length === 2) {
                                        const [startDate, endDate] = selectedDates;
                                        const formatDate = (date) => {
                                            const year = date.getFullYear();
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const day = String(date.getDate()).padStart(2, '0');
                                            return `${year}-${month}-${day}`;
                                        };
                                        const formattedStartDate = formatDate(startDate);
                                        const formattedEndDate = formatDate(endDate);
                                        setFormData({ ...formData, "from": formattedStartDate, "to": formattedEndDate });
                                    }
                                }}
                        /></div>
                        
                    </div>
                    

                    <div className='flex justify-center mt-2'>
                        <button className='bg-primary text-white p-2 font-bold rounded-md ' type='submit'>Submit</button>
                    </div>

                </form>

                <h5 className="mb-5 text-lg font-semibold dark:text-white-light">Reviews</h5>
                <div className='flex h-screen'>
                    <div className={` ${partnerId ? 'w-1/2' : 'w-full'}`}>
                        <section>

                        <div className="datatables">
                            {isMounted && (
                                <DataTable
                                    noRecordsText="No results match your search query"
                                    highlightOnHover
                                    className="table-hover whitespace-nowrap"
                                    records={initialRecords}
                                    onRowClick={({_id})=>setPartnerId(_id)}
                                    columns={[
                                        {
                                            accessor: '_id',
                                            title: 'Partner Id',
                                            render: ({ _id }) => <div className="text-info underliner">{_id} </div>,
                                        },
                                        {
                                            accessor: 'name',
                                            title: 'Name',
                                            render: ({ name }) => (
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold">{name}</div>
                                                </div>
                                            ),
                                        },
                                        {
                                            accessor: 'phone',
                                            title: 'Phone',
                                            render: ({ phone }) => (
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold">{phone}</div>
                                                </div>
                                            ),
                                        },
                                        {
                                            accessor: 'totalReviews',
                                            title: 'Total Reviews',
                                            sortable: true,
                                            render: ({ totalReviews }) => (
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold">{totalReviews}</div>
                                                </div>
                                            ),
                                        }
                                    ]}
                                    idAccessor='_id'
                                    fetching={isLoading}
                                    // sortStatus={sortStatus}
                                    // onSortStatusChange={setSortStatus}
                                    minHeight={200}
                                    emptyState={reviewsList?.success === false ? <div>{reviewsList?.message}</div> : <div>No records Found</div>}
                                />
                            )}
                        </div>
                        </section>
                    </div>


                { 
                    partnerId && 
                    <div className={`${partnerId ? 'w-1/2 inline' : 'hidden'} sticky border-l-2 px-4`}>
                       <ComponentShowReview partnerId={partnerId}/>
                       <button className='btn-danger p-2 my-2 m-auto rounded-md cursor-pointer'
                            onClick={() =>setPartnerId(null)}>Dismiss
                        </button>
                    
                    </div>
                }
                </div>
            </div >
        </>
    );
}

export default ComponentAllReviews;