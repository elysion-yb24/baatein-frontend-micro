'use client'
import { DataTable } from "mantine-datatable";
import IconCaretDown from '@/components/icon/icon-caret-down';
import { useRouter } from "next/navigation";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

function ComponentTransactionsTable({isMounted, initialRecords,formData,setFormData,isLoading,transactionsData ,handleQuery}) {
    const router=useRouter();
    const MySwal = withReactContent(Swal); 

    const roleStatusColor = (role) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        role = role.toLowerCase();
        if (role === "done") return color[2];
        else if (role === "failed") return color[3];
        else return color[4];
    };

    function convertToIST(utcString) {
        const utcDate = new Date(utcString);
        if (isNaN(utcDate.getTime()) || utcDate.getFullYear() === 1970) return 'N/A';
        return utcDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }

    return (
        <div className="panel mt-6">
                <h5 className="mb-5 text-lg font-semibold dark:text-white-light">Transactions Records</h5>

                <div className="datatables">
                    {isMounted && (
                        <DataTable
                            noRecordsText="No results match your search query"
                            highlightOnHover
                            className="table-hover whitespace-nowrap"
                            records={initialRecords}
                            onRowClick={(record,index,event)=>{
                                if(record?.notes?.channelId) router.push('/call-history'+'?channelId='+record?.notes?.channelId)
                                else {
                                    MySwal.fire({
                                        title: 'Error',
                                        text: 'Payment Type Recharge or Channel Id not available',
                                        icon: 'error',
                                        confirmButtonText: 'Ok',
                                    })
                                }
                            }}
                            columns={[
                                {
                                    accessor: '_id',
                                    title: 'Transaction Id',
                                    sortable: true,
                                    render: ({ _id }) => <strong className="text-info">{_id}</strong>,
                                },
                                {
                                    accessor: 'amount',
                                    title: 'Amount',
                                    sortable: true,
                                    render: ({ amount }) => (
                                        <div className="flex items-center gap-2">
                                            <div className={`font-bold ${amount < 0 ? 'text-red-500' : 'text-green-500'}`}>{amount.toFixed(2)}</div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'balance',
                                    title: 'Balance',
                                    sortable: true,
                                    render: ({ balance }) => (
                                        <div className="flex items-center gap-2">
                                            <div className={`font-bold ${balance < 0 ? 'text-red-500' : 'text-green-500'}`}>{balance?.toFixed(2)}</div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'notes',
                                    title: 'Caller Name',
                                    render: ({ notes }) => <div className="flex items-center gap-2">
                                        <strong className="text-primary">{notes?.callerName}</strong>
                                    </div>
                                },
                                {
                                    accessor: 'userId',
                                    title: 'User Id',
                                    sortable: true,
                                    render: ({ userId }) => (
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold">{userId}</div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'paymentFor',
                                    title: 'Payment For',
                                    render: ({ paymentFor }) => <div className="flex items-center gap-2">
                                        <strong className="font-bold">{paymentFor}</strong>
                                    </div>,
                                },
                                {
                                    accessor: 'notes',
                                    title: 'Notes',
                                    render: ({ notes }) => <div className="flex items-center gap-2">
                                        <strong className="text-secondary">{JSON.stringify(notes)}</strong>
                                    </div>,
                                },
                                {
                                    accessor: 'status',
                                    title: 'Status',
                                    render: ({ status }) => <div className="flex items-center justify-center">
                                        <span className={`badge bg-${roleStatusColor(status)} rounded-full`}>{status}</span>
                                    </div>
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Transaction Time',
                                    render: ({ createdAt }) => <div className="flex items-center justify-center">
                                        <span className={`font-bold p-2`}>{convertToIST(createdAt)}</span>
                                    </div>
                                }
                            ]}
                            idAccessor='_id'
                            fetching={isLoading}
                            // sortStatus={sortStatus}
                            // onSortStatusChange={setSortStatus}
                            minHeight={200}
                            emptyState={transactionsData?.success === false ? <div>{transactionsData.message}</div> : <div>No records Found</div>}
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
            </div>

    );
}

export default ComponentTransactionsTable;