
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
import ComponentReadCalls from '../calls/components-read-calls';
import ComponentReadTransactions from '../transactions/components-read-transactions';
import ComponentTransactionsTable from '../transactions/components-transaction-table';
import ComponentCallsTable from '../calls/components-calls-table';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import VideoPlayer from '../videos/VideoPlayer';

function ComponentCallHistory({ callsData, transactionsData }) {
    const MySwal = withReactContent(Swal);
    const [isMounted, setIsMounted] = useState(false);
    const [callsInitialRecords, setCallsInitialRecords] = useState(callsData?.data || [])
    const [transactionsInitialRecords, setTransactionsInitialRecords] = useState(transactionsData?.data || [])
    const [isLoading, setLoading] = useState(false)
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        channelId: searchParams.get('channelId') || ''
    })
    const videoData = useSelector((state) => state.video.data)
    const { push,refresh } = useRouter();
    const pathname = usePathname();
    const handleQuery = (paramsFormData) => {
        try {
            setLoading(true)
            const params = new URLSearchParams(searchParams)
            for (let key in paramsFormData) {
                params.set(key, paramsFormData[key])
            }
            push(`${pathname}?${params.toString()}`, { scroll: false })
            refresh();
            setTimeout(() => {
                setLoading(false)
            }, 1000)
        } catch (err) {
            alert('err', err)
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData['channelId']) {
            MySwal.fire({
                title: 'Error',
                text: 'Please select channel id',
                icon: 'error',
                confirmButtonText: 'Ok',
            })
            return
        }
        e.preventDefault();
        const updatedFormData = { ...formData }
        handleQuery(updatedFormData);
    }


    useEffect(() => {
        if (!searchParams.get('channelId')) {
            MySwal.fire({
                title: 'Error',
                text: 'Please select channel id',
                icon: 'error',
                confirmButtonText: 'Ok',
            })
        }
        setCallsInitialRecords(callsData.data || []);
        setTransactionsInitialRecords(transactionsData.data || []);
        setFormData({
            channelId: searchParams.get('channelId') || '',
        })
    }, [searchParams])

    useEffect(() => {
        setIsMounted(true);
    }, []);


    // useEffect(() => {
    //     const data = sortBy(initialRecords, sortStatus.columnAccessor);
    //     setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    // }, [sortStatus]);

    console.log('rendering call history with',videoData);
    return (
        <>

            {/* Search Queries */}
            <form className="mx-auto w-full mb-5" onSubmit={handleSubmit}>
                <div className=' grid sm:grid-cols-2 md:grid-cols-3 gap-4'>
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
                </div>

                <div className='flex justify-center mt-2'>
                    <button className='bg-primary text-white p-2 font-bold rounded-md ' type='submit'>Submit</button>
                </div>
            </form>



            <div className='flex'>
                <div className={` ${videoData ? 'w-1/2' : 'w-full'}`}>

                    {/* Transaction Table */}
                    <ComponentTransactionsTable isMounted={isMounted} initialRecords={transactionsInitialRecords} formData={formData} isLoading={isLoading} setFormData={setFormData} transactionsData={transactionsData} handleQuery={handleQuery} />
                    {/* Calls Table */}
                    <ComponentCallsTable isMounted={isMounted} initialRecords={callsInitialRecords} formData={formData} isLoading={isLoading} setFormData={setFormData} callsData={callsData} handleQuery={handleQuery} />
                </div>


                <div className={`${videoData ? 'w-1/2 inline' : 'hidden'} p-4 m-2 sticky`}>
                    {videoData && <VideoPlayer videoUrl={videoData} />}
                </div>
            </div>
        </>

    );
}
export default ComponentCallHistory;
