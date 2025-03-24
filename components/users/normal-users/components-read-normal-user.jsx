'use client'
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { Fragment, useEffect, useState } from 'react';
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
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import IconX from '@/components/icon/icon-x';
import { managePartnerPermissions } from '@/utils';
import Cookies from 'universal-cookie';
import Image from 'next/image';

function ComponentReadNormalUsers({ usersData }) {
    // console.log("usersData", usersData)
    // const [page, setPage] = useState(1);
    // const PAGE_SIZES = [10, 20, 30, 50, 100];
    // const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    // const [recordsData, setRecordsData] = useState(initialRecords);
    const [isLoading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null);
    const [modal1, setModal1] = useState(false);
    const [initialRecords, setInitialRecords] = useState(usersData?.data?.user || []);
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const router=useRouter();
    const MySwal = withReactContent(Swal);
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        name: searchParams.get('name') || '',
        userId: searchParams.get('userId') || '',
        role: searchParams.get('role') || '',
        numericId: searchParams.get('numericId') || '',
        phone: searchParams.get('phone') || '',
        skip: Number(searchParams.get('skip')) || 0,
        limit: 10
    })
    const { push, replace } = useRouter();
    const pathname = usePathname();

    const roleOptions = [
        { value: 'friend', label: 'Friend' },
        { value: 'user', label: 'User' },
        {value:'blockedList',label:'Blocked Partners'}
    ];


    const handleQuery = (paramsFormData) => {
        try {
            setLoading(true)
            const params = new URLSearchParams(searchParams)
            for (let key in paramsFormData) {
                params.set(key, paramsFormData[key])
            }
            push(`${pathname}?${params.toString()}`, { scroll: false })
            setTimeout(() => {
                setLoading(false)
            }, 1000)
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
        const updatedFormData = { ...formData, "skip": 0 }
        handleQuery(updatedFormData);
    }
    const [sortStatus, setSortStatus] = useState({
        columnAccessor: 'id',
        direction: 'asc',
    });
    const handleManagePartners = async() => {
        try {
            const cookies = new Cookies(null, { path: '/' })
            let body = {
                userId: selectedUser?._id || '',
                isBlocked: selectedUser?.isBlocked || false,
                isVideoCallAllowedAdmin: selectedUser?.isVideoCallAllowedAdmin || false,
                blockedReason: selectedUser?.blockedReason || '',
            }
            let access_token = cookies.get('access_token')
            let result = await managePartnerPermissions('/user/api/admin/block-unblock-partner', access_token, body)
            if (result?.success) {
                MySwal.fire({
                    title: result?.message,
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 3000,
                    showCloseButton: true,
                    background: 'green'
                });
            } else {
                MySwal.fire({
                    title: result?.message,
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 3000,
                    showCloseButton: true,
                    background: 'red'
                });
            }
            
        } catch (err) {
              console.error('Err in handleManagePartners', err)
              MySwal.fire({
                title: 'Frontend Error'+ err.toString(),
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
                background: 'red'
            });
        }
        finally{
            setModal1(false)
            router.refresh();
        }
    }


    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setInitialRecords(usersData?.data?.user || [])
        setFormData({
            name: searchParams.get('name') || '',
            userId: searchParams.get('userId') || '',
            role: searchParams.get('role') || '',
            numericId: searchParams.get('numericId') || '',
            phone: searchParams.get('phone') || '',
            skip: Number(searchParams.get('skip')) || 0,
            limit: 10
        })
    }, [searchParams, usersData]);

    useEffect(() => {
        setIsMounted(true);
    }, []);



    const [column, setColumn] = useState([
        {
            accessor: '_id',
            title: 'User Id',
            sortable: true,
            render: ({ _id }) => <Link className="text-info" href={'/users/update-users?userId=' + _id}>{_id}</Link>,
        },
        {
            accessor: 'name',
            title: 'Name',
            sortable: true,
            render: ({ name }) => (
                <div className="flex items-center gap-2">
                    <div className="font-bold">{name}</div>
                </div>
            ),
        },
        {
            accessor: 'phone',
            title: 'Phone',
            render: ({ phone }) => <div className="flex items-center gap-2">
                <strong className="font-bold">{phone}</strong>
            </div>,
        },
        {
            accessor: 'createdAt',
            title: 'Created At',
            render: ({ createdAt }) => <div className="flex items-center justify-center">
                <span className={`font-bold p-2`}>{createdAt}</span>
            </div>
        }
    ])

    useEffect(() => {
        if (formData.role !== 'user') {
            setColumn((prevCol) => {
                if (!prevCol.find((col) => col.accessor === 'videoRpm')) {
                    prevCol.push({
                        accessor: 'videoRpm',
                        title: 'Video Rpm',
                        sortable: true,
                        render: ({ videoRpm }) => (
                            <div className="flex items-center gap-2 justify-center">
                                <div className={`font-bold`}>{videoRpm}</div>
                            </div>
                        )
                    })
                }
                if (!prevCol.find((col) => col.accessor === 'status')) {
                    prevCol.push({
                        accessor: 'status',
                        title: 'Status',
                        render: ({ status }) => <div className="flex items-center justify-center">
                            <span className={`badge bg-${roleStatusColor(status)} rounded-full`}>{status}</span>
                        </div>
                    })
                }
                if (!prevCol.find((col) => col.accessor === 'manage')) {
                    prevCol.push({
                        accessor: 'manage',
                        title: 'Manage',
                        render: (user) => {
                            return user?.role=='friend' &&<button className='bg-primary text-white p-2 rounded-md'
                                onClick={() => {
                                    setModal1(true);
                                    setSelectedUser(user)
                                }}
                            >Manage</button>
                        }
                    })
                }
                if (!prevCol.find((col) => col.accessor === 'profile')) {
                    prevCol.push({
                        accessor: 'profile',
                        title: 'Profile',
                        render: ({avatar}) => {
                            return <Image className='rounded-md' src={avatar} width={30} height={30}/>
                        }
                    })
                }
                return prevCol
            }
            )
        }

        if(formData.role === 'user'){
            setColumn((prevCol) => {
                prevCol=prevCol.filter((col) => col.accessor !== 'videoRpm');
    
                prevCol=prevCol.filter((col) => col.accessor !== 'status')
    
                prevCol=prevCol.filter((col) => col.accessor !== 'manage')
    
                prevCol=prevCol.filter((col) => col.accessor !== 'profile')
    
                return prevCol
            })
        }
    }, [isLoading])

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    }, [sortStatus]);

    return (
        <>
            {/* Search Queries */}
            <form className="mx-auto w-full mb-5" onSubmit={handleSubmit}>
                <div className=' grid sm:grid-cols-2 md:grid-cols-3 gap-4'>

                    {/* Name */}
                    <div className="relative">
                        <label>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            placeholder="Name ...."
                            name="name"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                    </div>

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

                    {/* Numeric Id */}
                    <div className="relative">
                        <label>Numeric Id</label>
                        <input
                            type="text"
                            value={formData.numericId}
                            placeholder="Numeric Id ...."
                            name="numericId"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                    </div>

                    {/* Role  */}
                    <div className="relative">
                        <label>Role</label>
                        <Select
                            defaultValue={formData.role}
                            options={roleOptions}
                            isSearchable={false}
                            onChange={(e) => setFormData({ ...formData, ["role"]: e?.value })}
                            name="paymentFor"
                            className='z-[10]'
                        />

                    </div>

                    {/* Phone number */}
                    <div className="relative">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            value={formData.phone}
                            placeholder="Phone number ...."
                            name="phone"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                    </div>
                </div>


                <div className='flex justify-center mt-2'>
                    <button className='bg-primary text-white p-2 font-bold rounded-md ' type='submit'>Search</button>
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
                                        <div className="text-lg font-bold">{selectedUser?.name}</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal1(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <div className='flex flex-col'>

                                            <label className="inline-flex">
                                                <input type="checkbox" className="form-checkbox rounded-full text-dark outline-success" checked={selectedUser?.isVideoCallAllowedAdmin} value={selectedUser?.isVideoCallAllowedAdmin} name={'isVideoCallAllowedAdmin'}
                                                    onChange={(e) => {
                                                        setSelectedUser({ ...selectedUser, [e.target.name]: e.target.checked })
                                                    }}
                                                />
                                                <span>isVideoCallAllowedAdmin</span>
                                            </label>
                                            <label className="inline-flex">
                                                <input type="checkbox" className="form-checkbox rounded-full text-dark outline-success" checked={selectedUser?.isBlocked || false} value={selectedUser?.isBlocked || false} name={'isBlocked'}
                                                    onChange={(e) => {
                                                        setSelectedUser({ ...selectedUser, [e.target.name]: e.target.checked })
                                                    }}
                                                />
                                                <span>isBlockedUser</span>
                                            </label>
                                            <label>Blocked Reason
                                                <textarea value={selectedUser?.blockedReason} name="blockedReason" className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11" onChange={(e) => { setSelectedUser({ ...selectedUser, [e.target.name]: e.target.value }) }} placeholder='Block Reason if any,this is not mandatory' />
                                            </label>
                                        </div>

                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => {
                                                setSelectedUser(null)
                                                setModal1(false)
                                            }}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={handleManagePartners}>
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


            {/* Records Table */}
            <div className="panel mt-6">
                <h5 className="mb-5 text-lg font-semibold dark:text-white-light">{formData.role} Data</h5>

                <div className="datatables">
                    {isMounted && (
                        <DataTable
                            noRecordsText="No results match your search query"
                            highlightOnHover
                            className="table-hover whitespace-nowrap"
                            records={initialRecords}
                            columns={column}
                            idAccessor='_id'
                            fetching={isLoading}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            emptyState={usersData?.success === false ? <div>{usersData.message}</div> : <div>No records Found</div>}
                        />
                    )}
                </div>

                {/* For pagination */}
                <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse m-auto mt-4">
                    {/* Prev button */}
                    <li>
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

        </>

    );
}

export default ComponentReadNormalUsers;