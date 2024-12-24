'use client'
import { DataTable } from "mantine-datatable";
import IconCaretDown from '../icon/icon-caret-down';
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addVideo, removeVideo } from "@/store/videoSlice";
import { useEffect } from "react";
import Link from "next/link";

function ComponentCallsTable({ isMounted, initialRecords, formData, setFormData, isLoading, callsData, handleQuery }) {
    // console.log(callsData)
    const dispatch = useDispatch();
    const { push } = useRouter();

    useEffect(() => {
        return () => {
            dispatch(removeVideo());
        }
    }, [])
    return (
        <>
            {/* Records Table */}
            <div className="panel mt-6">
                <h5 className="mb-5 text-lg font-semibold dark:text-white-light">Call Records</h5>

                <div className="datatables">
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
                                    render: ({ _id, channelId }) => <Link className="text-info underliner" href={'/call-history' + '?channelId=' + channelId}>{_id}</Link>,
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
                                    accessor: 'awsUrl',
                                    title: 'Play Video',
                                    render: ({ awsUrl,type}) =>

                                        <div className="flex items-center gap-2 justify-center">
                                            {awsUrl?.includes('.m3u8') ? <button className="btn btn-sm btn-primary" onClick={() => {
                                                dispatch(addVideo(awsUrl));
                                            }}>Play {type}</button> : 'n/a'}
                                        </div>

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
                            // sortStatus={sortStatus}
                            // onSortStatusChange={setSortStatus}
                            minHeight={200}
                            emptyState={callsData?.success === false ? <div>{callsData.message}</div> : <div>No records Found</div>}
                        />
                    )}
                </div>

                {/* For pagination */}
                <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse m-auto mt-4">
                    {/* Prev button */}
                    <li>
                        <button
                            type="button"
                            className={`flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${(!formData.skip || formData.skip === 0) && 'cursor-not-allowed hover:bg-primary-light'}`}
                            onClick={() => {
                                let updatedFormData = { ...formData, skip: Number(formData.skip) - 10 }
                                setFormData(updatedFormData);
                                handleQuery(updatedFormData);
                            }}
                            disabled={!formData.skip || formData.skip === 0}
                        >
                            <IconCaretDown className="h-5 w-5 rotate-90 rtl:-rotate-90" />
                        </button>
                    </li>

                    {/* Next Button */}
                    <li>
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
                    </li>
                </ul>
            </div >
        </>
    );
}

export default ComponentCallsTable;