'use client'
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useSelector } from 'react-redux';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import IconCaretDown from '../icon/icon-caret-down';
import ComponentCallsTable from '@/components/calls/components-calls-table'
import VideoPlayer from '@/components/videos/VideoPlayer';
import { removeVideo } from '@/store/videoSlice';
import { useDispatch } from 'react-redux';
import Select from 'react-select';

function ComponentReadCalls({ callsData }) {
    // const [page, setPage] = useState(1);
    // const PAGE_SIZES = [10, 20, 30, 50, 100];
    // const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    // const [recordsData, setRecordsData] = useState(initialRecords);
    const [isLoading, setLoading] = useState(false)
    const videoData = useSelector((state) => state.video.data)
    const [initialRecords, setInitialRecords] = useState(callsData.data || []);
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const searchParams = useSearchParams();
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        from: searchParams.get('from') || '',
        to: searchParams.get('to') || '',
        receiverId: searchParams.get('receiverId') || '',
        callerId: searchParams.get('callerId') || '',
        channelId: searchParams.get('channelId') || '',
        skip: Number(searchParams.get('skip')) || 0,
        isRecorded:searchParams.get('isRecorded') || '',
        callType:searchParams.get('callType') || '',
        limit: 10
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

    const callTypeOptions = [
        {value: '', label:'All'},
        { value: 'call', label: 'Call' },
        { value: 'video', label: 'Video' },
    ];
    const recordingsOptions = [
        { value: 'true', label: 'Recordings' },
        { value: '', label: 'All' },
    ];
    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedFormData = { ...formData, "skip": 0 }
        handleQuery(updatedFormData);
    }
    const [sortStatus, setSortStatus] = useState({
        columnAccessor: 'id',
        direction: 'asc',
    });


    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setInitialRecords(callsData.data || [])
        setFormData({
            from: searchParams.get('from') || '',
            to: searchParams.get('to') || '',
            receiverId: searchParams.get('receiverId') || '',
            callerId: searchParams.get('callerId') || '',
            channelId: searchParams.get('channelId') || '',
            skip: Number(searchParams.get('skip')) || 0,
            callType:searchParams.get('callType') || '',
            limit: 10
        })
    }, [searchParams])

    useEffect(() => {
        setIsMounted(true);
    }, []);


    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
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
                    {/* Channel Id */}
                    <div className="relative">
                        <label>Channel Id</label>
                        <input
                            type="text"
                            value={formData.channelId}
                            placeholder="Channel Id ...."
                            name="channelId"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                    </div>
                    {/* Caller Id */}
                    <div className="relative">
                        <label>Caller Id</label>

                        <input
                            type="text"
                            value={formData.callerId}
                            placeholder="Caller Id ...."
                            name="callerId"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                    </div>
                    {/* Receiver Id */}
                    <div className="relative">
                        <label>Receiver Id</label>

                        <input
                            type="text"
                            value={formData.receiverId}
                            name="receiverId"
                            placeholder="Receiver Id ...."
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                    </div>

                     {/* Call Type */}
                     <div className="relative">
                        <label>Call Type</label>
                        <Select
                            defaultValue={formData.callType}
                            options={callTypeOptions}
                            isSearchable={false}
                            onChange={(e) => setFormData({ ...formData, ["callType"]: e?.value })}
                            name="callType"
                            className='z-[15]'
                        />
                    </div>
                     {/* Recorded */}
                     <div className="relative">
                        <label>Recordings</label>
                        <Select
                            defaultValue={formData.isRecorded}
                            options={recordingsOptions}
                            isSearchable={false}
                            onChange={(e) => setFormData({ ...formData, ["isRecorded"]: e?.value })}
                            name="isRecorded"
                            className='z-[10]'
                        />
                    </div>
                </div>
                   

                <div className='flex justify-center mt-2'>
                    <button className='bg-primary text-white p-2 font-bold rounded-md ' type='submit'>Submit</button>
                </div>

            </form>



            {/* Records Table */}
            {/* <div className="panel mt-6">
                <h5 className="mb-5 text-lg font-semibold dark:text-white-light">Call Records</h5>  */}

            {/* <div className="datatables">
                    {isMounted && (
                        <DataTable
                            noRecordsText="No results match your search query"
                            highlightOnHover
                            className="table-hover whitespace-nowrap"
                            records={initialRecords}
                            columns={[
                                {
                                    accessor: '_id',
                                    title: 'Call Id',
                                    sortable: true,
                                    render: ({ _id }) => <strong className="text-info">{_id}</strong>,
                                },
                                {
                                    accessor: 'callerName',
                                    title: 'Caller',
                                    sortable: true,
                                    render: ({ callerName }) => (
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold">{callerName}</div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'receiverName',
                                    title: 'Receiver',
                                    sortable: true,
                                    render: ({ receiverName }) => (
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold">{receiverName}</div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'channelId',
                                    title: 'Channel Id',
                                    render: ({ channelId }) => <div className="flex items-center gap-2">
                                        <strong className="text-danger">{channelId}</strong>
                                    </div>,
                                },
                                {
                                    accessor: 'callerId',
                                    title: 'Caller Id',
                                    render: ({ callerId }) => <div className="flex items-center gap-2">
                                        <strong className="text-primary">{callerId}</strong>
                                    </div>,
                                },
                                {
                                    accessor: 'receiverId',
                                    title: 'Receiver Id',
                                    render: ({ receiverId }) => <div className="flex items-center gap-2">
                                        <strong className="text-secondary">{receiverId}</strong>
                                    </div>,
                                },
                                {
                                    accessor: 'receiverDuration',
                                    title: 'Duration',
                                    render: ({ receiverDuration }) => <div className="flex items-center gap-2 justify-center">
                                        <div className="font-semibold text-center">{(receiverDuration / 60)?.toFixed(0) > 0 ? (receiverDuration / 60)?.toFixed(0) : ''} {(receiverDuration / 60).toFixed(0) > 0 && 'mins'} {receiverDuration % 60} secs</div>
                                    </div>,
                                },

                                {
                                    accessor: 'status',
                                    title: 'Status',
                                    render: ({ status }) => <>{status}</>
                                },
                                { accessor: 'reason', title: 'Reason', render: ({ reason }) => <>{reason ? reason : 'N/A'}</> }
                            ]}
                            idAccessor='_id'
                            fetching={isLoading}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            emptyState={callsData?.success===false?<div>{callsData.message}</div>:<div>No records Found</div>}
                        />
                    )}
                </div> */}

            {/* For pagination  */}
            {/* <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse m-auto mt-4"> */}
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
            {/* </ul> */}
            {/* </div >  */}


            <div className='flex'>
                <div className={` ${videoData ? 'w-1/2' : 'w-full'}`}>

                    {/* Calls Table */}
                    <ComponentCallsTable isMounted={isMounted} initialRecords={initialRecords} formData={formData} isLoading={isLoading} setFormData={setFormData} callsData={callsData} handleQuery={handleQuery} />
                </div>


                {videoData &&
                    <div className={`${videoData ? 'w-1/2 inline' : 'hidden'} p-4 m-2 sticky`}>
                        <VideoPlayer videoUrl={videoData} />
                        <button className='btn-danger p-2 my-2 m-auto rounded-md cursor-pointer'
                            onClick={() => dispatch(removeVideo())}>Dismiss Video</button>
                    </div>}
            </div>

        </>

    );
}

export default ComponentReadCalls;