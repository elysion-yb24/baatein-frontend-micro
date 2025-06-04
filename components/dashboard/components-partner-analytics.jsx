'use client'
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import { useSelector } from 'react-redux';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import IconCaretDown from '@/components/icon/icon-caret-down';
import Select from 'react-select'
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../icon/icon-x';
import Cookies from 'universal-cookie';
import { getPartnerCategoryList, getUserInterests, updatePartnerCategory } from '@/utils';
import AsyncSelect from 'react-select/async';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import PartnerReviewsComponent from '@/components/dashboard/components-review';

function ComponentPartnerAnalytics({ analyticsData, errorMessage }) {
    // const [page, setPage] = useState(1);
    // const PAGE_SIZES = [10, 20, 30, 50, 100];
    // const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    // const [recordsData, setRecordsData] = useState(initialRecords);
    function convertToIST(utcString) {
        const utcDate = new Date(utcString);
        if (isNaN(utcDate.getTime()) || utcDate.getFullYear() === 1970) return 'N/A';
        return utcDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
    const MySwal = withReactContent(Swal);
    const cookies = new Cookies(null, { path: '/' })
    const [partnerCategory, setPartnerCategory] = useState({
        partnerName: '',
        partnerId: '',
        currentCategory: '',
        selectedCategory: '',
        isModal: false
    })
    const [isLoading, setLoading] = useState(false)
    const [modal1, setModal1] = useState(false);
    const [initialRecords, setInitialRecords] = useState(analyticsData || []);
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        userId: searchParams.get('userId') || ''
    })
    const { push, replace } = useRouter();
    const pathname = usePathname();

    const handleQuery = (paramsFormData) => {
        try {
            setLoading(true)
            const params = new URLSearchParams(searchParams)
            for (let key in paramsFormData) {
                params.set(key, paramsFormData[key])
            }
            push(`${pathname}?${params.toString()}`, { scroll: false })
        } catch (err) {
            alert('err', err)
            setLoading(false)
        }
    }

    const roleStatusColor = (role) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        role = role.toLowerCase();
        if (role === "online") return color[2];
        else if (role === "offline") return color[3];
        else return color[4];
    };

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
        setInitialRecords(analyticsData)
        setFormData({
            userId: searchParams.get('userId') || '',
        })
        setLoading(false);
    }, [analyticsData])

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const promiseOptionsCategory = async () => {
        try {
            const access_token = cookies.get('access_token')
            const refresh_token = cookies.get('token')
            const { data, success, message } = await getPartnerCategoryList('/team/partner-category', access_token, refresh_token);
            if (!success) throw Error(message);
            return data;
        } catch (err) {
            console.log('error', err);
            return [];
        }
    }
    const handleModal1Submit = async () => {
        setModal1(!modal1);

        try {
            const access_token = cookies.get('access_token')
            const { success, message } = await updatePartnerCategory('/team/update-partner-category', access_token, {
                userId: partnerCategory.partnerId,
                category: partnerCategory.selectedCategory,
            })
            if (!success) throw Error(message)

            MySwal.fire({
                title: message,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
                background: 'green'
            });
            setInitialRecords(initialRecords.map((item) => {
                if (item.receiverId === partnerCategory.partnerId) {
                    item.category = partnerCategory.selectedCategory
                }
                return item
            }))
        } catch (err) {
            console.log('error', err);
            MySwal.fire({
                title: err,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
                background: 'red'
            });
        }
        setPartnerCategory({ ...partnerCategory, selectedCategory: '' });
    }

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.sort(function (a, b) { return b[sortStatus.columnAccessor] - a[sortStatus.columnAccessor] }) : data.sort(function (a, b) { return a[sortStatus.columnAccessor] - b[sortStatus.columnAccessor] }));
    }, [sortStatus]);

    return (
        <>
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
                    {/* User Id */}
                    <div className="relative">
                        <label>User Id</label>
                        <input
                            type="text"
                            value={formData.userId}
                            placeholder="User Id ...."
                            name="userId"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                    </div>

                </div>


                <div className='flex justify-center mt-2'>
                    <button className='bg-primary text-white p-2 font-bold rounded-md ' type='submit'>Submit</button>
                </div>

            </form>


            {/* Modal  */}
            <Transition appear show={modal1} as={Fragment}>
                <Dialog as="div" open={modal1} onClose={() => setModal1(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel as="div" className="panel my-8 w-full max-w-lg rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <div className="text-lg font-bold">Partner Category</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal1(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <p>Partner Name : {partnerCategory.partnerName}</p>
                                        <p>Current Category : {partnerCategory.currentCategory}</p>
                                        <p>Selected Category : {partnerCategory.selectedCategory || 'none'}</p>
                                        <AsyncSelect
                                            cacheOptions
                                            defaultOptions
                                            loadOptions={promiseOptionsCategory}
                                            name="partnerCategory"
                                            id="partnerCategory"
                                            required
                                            isSearchable
                                            value={partnerCategory.selectedCategory}
                                            onChange={(e) => {
                                                setPartnerCategory({ ...partnerCategory, selectedCategory: e.value }
                                                )
                                            }}
                                        />
                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => {
                                                setModal1(false)
                                                setPartnerCategory({ ...partnerCategory, selectedCategory: '',partnerId:'',partnerName:'' })
                                            }}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={handleModal1Submit}>
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>


            <div className='flex'>
                <div className={` ${partnerCategory?.partnerId && partnerCategory?.isModal === false ? 'w-1/2' : 'w-full'}`}>

                    {/* Records Table */}
                    <div className="panel mt-6">
                        <h5 className="mb-5 text-lg font-semibold dark:text-white-light ">{formData.role} Data</h5>

                        <div className="datatables">
                            {isMounted && (
                                <DataTable
                                    noRecordsText="No results match your search query"
                                    // highlightOnHover
                                    className=" whitespace-nowrap"
                                    records={initialRecords}
                                    rowClassName={({ partnerId,totalPaidCalls, totalMissedCalls, missedCallsPercent, totalFreeCalls, conversionPercent }) => {
                                        // if(partnerCategory.partnerId===receiverId) return '!bg-gray-200';
                                        // if (totalPaidCalls === 0 && totalMissedCalls === 0 && totalFreeCalls === 0) return ''
                                        // if (totalFreeCalls === 0) return ''
                                        // if (missedCallsPercent > 30 || conversionPercent < 10) return '!bg-[#ffa8a8]' 
                                        return '';
                                    }}
                                    // onRowClick={({ receiverId, category, receiverName }) => {
                                    //     setIsSelected(receiverId)
                                    // }}
                                    highlightOnHover
                                    columns={
                                        [
                                            {
                                                accessor: '_id',
                                                title: 'User Id',
                                                render: ({ partnerId }) => <div className="text-info">{partnerId}</div>,
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
                                                accessor:'phone',
                                                title:'Phone',
                                                render:({phone})=>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold">{phone}</div>
                                                    </div>
                                            },
                                            {
                                                accessor: 'totalMissedCalls',
                                                title: 'Missed Calls',
                                                sortable: true,
                                                render: ({ totalMissedCalls }) => <div className="flex items-center gap-2">
                                                    <strong className="font-bold">{totalMissedCalls}</strong>
                                                </div>,
                                            },
                                            {
                                                accessor: 'totalFreeCalls',
                                                title: 'Free Calls Count',
                                                sortable: true,
                                                render: ({ totalFreeCalls }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalFreeCalls}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalPaidCalls',
                                                title: 'Paid Calls Count',
                                                sortable: true,
                                                render: ({ totalPaidCalls }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalPaidCalls}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalVideoCalls',
                                                title:  'Video Calls Count',
                                                sortable: true,
                                                render: ({ totalVideoCalls }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalVideoCalls}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalFreeCallsDuration',
                                                title: 'Total Free Call Duration',
                                                sortable: true,
                                                render: ({ totalFreeCallsDuration }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalFreeCallsDuration} {'secs'}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalPaidCallsDuration',
                                                title: 'Total Paid Call Duration',
                                                sortable: true,
                                                render: ({ totalPaidCallsDuration }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalPaidCallsDuration} secs</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalVideoDuration',
                                                title: 'Total Video Duration',
                                                sortable: true,
                                                render: ({ totalVideoDuration }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalVideoDuration} {'secs'}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'avgRating',
                                                title: 'Avg Rating',
                                                sortable: true,
                                                render: ({ avgRating }) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{avgRating?.toFixed(2)}</span>
                                                    </div>
                                                }
                                            },
                                            {
                                                accessor: 'convertedLeads',
                                                title: 'Converted Leads',
                                                sortable: true,
                                                render: ({ convertedLeads }) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{convertedLeads}</span>
                                                    </div>
                                                }
                                            },
                                            {
                                                accessor: 'convertedLeadSelf',
                                                title: 'Converted Leads Self',
                                                sortable: true,
                                                render: ({ convertedLeadSelf }) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{convertedLeadSelf}</span>
                                                    </div>
                                                }
                                            },
                                            {
                                                accessor: 'conversionPercent',
                                                title: 'Conversion',
                                                sortable: true,
                                                render: ({ conversionPercent }) => {
                                                    return <div className="flex items-center justify-center">
                                                        {/* <span className={`font-bold p-2`}>{totalCalls  ?  ((convertedLeads + convertedLeadSelf) / totalCalls * 100).toFixed(2) : 0}</span> */}
                                                        <span className={`font-bold p-2`}>{ conversionPercent}</span>
                                                    </div>
                                                }
                                            },
                                            {
                                                accessor: 'missedCallsPercent',
                                                title: 'Missed Calls percent',
                                                sortable: true,
                                                render: ({ missedCallsPercent}) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{missedCallsPercent}</span>

                                                    </div>
                                                }
                                            },
                                            // {
                                            //     accessor: 'totalReviews',
                                            //     title: 'Total Review',
                                            //     sortable: true,
                                            //     render: ({ totalReviews, receiverId, receiverName }) => {
                                            //         return <div className="flex items-center justify-center text-info text-underline cursor-pointer">
                                            //             <span className={`font-bold p-2`} onClick={() => setPartnerCategory({ ...partnerCategory, partnerId: receiverId, partnerName: receiverName, isModal: false })}>{totalReviews}</span>
                                            //         </div>
                                            //     }
                                            // },
                                            {
                                                accessor: 'totalGifts',
                                                title: 'Gifts',
                                                sortable: true,
                                                render: ({ totalGifts,giftAmounts }) =>{
                                                    return (<div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{totalGifts}</span>
                                                    </div>)
                                                }
                                            },
                                            {
                                                accessor: 'totalCallRevenueGenerated',
                                                title: 'Voice Call Revenue Generated',
                                                sortable: true,
                                                render: ({ totalCallRevenueGenerated }) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{totalCallRevenueGenerated?.toFixed(2)}</span>
                                                    </div>
                                                }
                                            },
                                            {
                                                accessor: 'totalCallEarnings',
                                                title: 'Voice Call Earnings',
                                                sortable: true,
                                                render: ({ totalCallEarnings }) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{totalCallEarnings?.toFixed(2)}</span>
                                                    </div>
                                                }
                                            },
                                            {
                                                accessor: 'totalVideoRevenueGenerated',
                                                title: 'Video Revenue Generated',
                                                sortable: true,
                                                render: ({ totalVideoRevenueGenerated }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalVideoRevenueGenerated?.toFixed(2)}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalVideoEarnings',
                                                title: 'Video Earnings',
                                                sortable: true,
                                                render: ({ totalVideoEarnings }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalVideoEarnings?.toFixed(2)}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalRevenueGenerated',
                                                title: 'Total Revenue ',
                                                sortable: true,
                                                render: ({totalRevenueGenerated }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalRevenueGenerated}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'totalEarnings',
                                                title: 'Total Earnings',
                                                sortable: true,
                                                render: ({totalEarnings }) => <div className="flex items-center justify-center">
                                                    <span className={`font-bold p-2`}>{totalEarnings}</span>
                                                </div>
                                            },
                                            {
                                                accessor: 'createdAt',
                                                title: 'Created At',
                                                sortable: true,
                                                render: ({ createdAt }) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{convertToIST(createdAt)}</span>
                                                    </div>
                                                }
                                            },
                                            {
                                                accessor: 'lastActive',
                                                title: 'Last Active',
                                                sortable: true,
                                                render: ({ lastActive }) => {
                                                    return <div className="flex items-center justify-center">
                                                        <span className={`font-bold p-2`}>{convertToIST(lastActive)}</span>
                                                    </div>
                                                } 
                                            }
                                            // {
                                            //     accessor: 'category',
                                            //     title: 'Category',
                                            //     sortable: true,
                                            //     render: ({ receiverId, category, receiverName }) => {
                                            //         return <div className="flex items-center justify-center cursor-pointer text-info" onClick={() => {
                                            //             setModal1(true);
                                            //             setPartnerCategory({ ...partnerCategory, currentCategory: category, partnerId: receiverId, partnerName: receiverName, isModal: true })
                                            //         }}>
                                            //             <span className={`font-bold p-2`}>{category || 'none'}</span>
                                            //         </div>
                                            //     }
                                            // }
                                        ]
                                    }
                                    idAccessor='_id'
                                    fetching={isLoading}
                                    sortStatus={sortStatus}
                                    onSortStatusChange={setSortStatus}
                                    minHeight={200}
                                    emptyState={errorMessage ? <div>{errorMessage}</div> : <div>No records Found</div>}
                                />
                            )}


                            
                        </div>
                        
                        {initialRecords &&
                            <div className='p-2 flex'>
                                <div>
                                    <span className="text-xl font-bold">Total Missed Calls :</span>
                                    <span className='text-lg'>
                                        {
                                            initialRecords.reduce((missedCalls,currentRecord)=>{
                                                return missedCalls + Number(currentRecord.totalMissedCalls)
                                            },0)
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold">Total Paid Calls :</span>
                                    <span className='text-lg'>
                                        {
                                            initialRecords.reduce((paidCalls,currentRecord)=>{
                                                return paidCalls + Number(currentRecord.totalPaidCalls)
                                            },0)
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold">Total Free Calls :</span>
                                    <span className='text-lg'>
                                        {
                                            initialRecords.reduce((freeCalls,currentRecord)=>{
                                                return freeCalls + Number(currentRecord.totalFreeCalls)
                                            },0)
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold">Total Calls :</span>
                                    <span className='text-lg'>
                                        {
                                            initialRecords.reduce((totalCalls,currentRecord)=>{
                                                return totalCalls + Number(currentRecord.totalMissedCalls+currentRecord.totalFreeCalls+currentRecord.totalPaidCalls)
                                            },0)
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold">Total Gifts :</span>
                                    <span className='text-lg'>
                                        {
                                            initialRecords.reduce((totalGifts,currentRecord)=>{
                                                return totalGifts + Number(currentRecord.totalGifts)
                                            },0)
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold">Total Revenue Generated :</span>
                                    <span className='text-lg'>
                                        {
                                            initialRecords.reduce((revenueSum,currentRecord)=>{
                                                return revenueSum + Number(currentRecord.totalRevenueGenerated)
                                            },0).toFixed(2)
                                        }
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xl font-bold">Partner Earnings :</span>
                                    <span className='text-lg'>
                                        {
                                            initialRecords.reduce((earningsSum,currentRecord)=>{
                                                return earningsSum + Number(currentRecord.totalEarnings)
                                            },0).toFixed(2)
                                        }
                                    </span>
                                </div>

                                

                                
                            </div>
                        }

                        {/* For pagination */}
                        <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse m-auto mt-4">
                            {/* Prev button */}
                            {/* <li>
                            <button
                                type="button"
                                className={`flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${formData.skip === 0 && 'cursor-not-allowed hover:bg-primary-light'}`}
                                onClick={() => {
                                    let updatedFormData = { ...formData, skip: Number(formData.skip) - 10 }
                                    setFormData(updatedFormData);
                                    handleQuery(updatedFormData);
                                }}
                                disabled={formData.skip === 0}
                            >
                                <IconCaretDown className="h-5 w-5 rotate-90 rtl:-rotate-90" />
                            </button>
                        </li> */}

                            {/* Next Button */}
                            {/* <li>
                            <button
                                type="button"
                                className={`flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${initialRecords.length < 10 && 'cursor-not-allowed hover:bg-primary-light'}`}
                                onClick={() => {
                                    let updatedFormData = { ...formData, skip: Number(formData.skip) + 10 }
                                    setFormData(updatedFormData);
                                    handleQuery(updatedFormData);
                                }}
                                disabled={initialRecords.length < 10}
                            >
                                <IconCaretDown className="h-5 w-5 -rotate-90 rtl:rotate-90" />
                            </button>
                        </li> */}
                        </ul>
                    </div>
                </div>


                {partnerCategory?.isModal === false && partnerCategory?.partnerId &&
                    <div className={`${partnerCategory?.partnerId ? 'w-1/2 inline' : 'hidden'} p-4 m-2`}>
                        {/* <VideoPlayer videoUrl={reviewsData} /> */}
                        <div className='sticky top-20'>
                            <h1 className="text-2xl font-bold my-4 text-center">{partnerCategory?.partnerName}</h1>
                            <PartnerReviewsComponent partnerId={partnerCategory?.partnerId} />
                            <button className='btn-danger p-2 my-2 m-auto rounded-md cursor-pointer'
                                onClick={() => setPartnerCategory({ ...partnerCategory, partnerId: '', partnerName: '' })}
                            >Close</button>
                        </div>
                    </div>}
            </div>


        </>

    );
}

export default ComponentPartnerAnalytics;