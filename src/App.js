import React, { useEffect, useState } from 'react'
import Entries from './Entries'
import dayjs from 'dayjs'
import axios from 'axios'
import { formatIndianCurrency } from './utils'

const loadEntries = () => {
  try {
    const raw = localStorage.getItem('goldEntries')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
const saveCurrentRate = entries => localStorage.setItem('currentRates', JSON.stringify(entries))

const loadPreviousRates = () => {
  try {
    const raw = localStorage.getItem('currentRates')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
const saveEntries = entries => localStorage.setItem('goldEntries', JSON.stringify(entries))

export default function App() {
  const [entries, setEntries] = useState(loadEntries())
  const [showModal, setShowModal] = useState(false)
  const [gram, setGram] = useState('')
  const [date, setDate] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [boughtFrom, setBoughtFrom] = useState('')
  const [purity, setPurity] = useState('24k')
  const [loading, setLoading] = useState(false)
  const [rateData, setRateData] = useState(loadPreviousRates())
  const [rates, setRates] = useState()

  console.log(rateData, 'rateData')
  console.log(rateData?.goldRate, 'rateData goldRate')


  useEffect(() => {
    // const rate = "₹1,29,114.94"
    const rate_24k = parseFloat(rateData?.goldRate?.replace(/[^0-9.]/g, ''));
    // const rate_24k = parseFloat(rate?.replace(/[^0-9.]/g, ''));
    const rate_per_gm24k = rate_24k / 10
    setRates({ rate_per_gm24k, rate_per_gm22k: rate_per_gm24k - 1100, rate_per_24k10gm: rate_24k })
  }, [rateData])

  const fetchRates = async () => {
    setLoading(true)
    try {



      //   const result = {"success":true,"goldRate":"₹1,29,767.16","fetched_on":"2025-10-16T04:36:35.431Z"}

      //  setRateData(result)
      //  saveCurrentRate(result)
      //  setLoading(false)
      //  return

      await axios.get('https://gold-rate-api-ooqd.onrender.com/api/gold-rate')
        .then(result => {
          const data = result?.data
          console.log(data, 'data')
          console.log(data?.goldRate, 'data goldRate')
          setRateData(data)
          saveCurrentRate(data)
          setLoading(false)
        })
        .catch(error => {
          setLoading(false)
          console.log('error', error)
        })

    } catch (err) {
      console.error('Error fetching rates:', err)
    }
  }


  const handleAdd = e => {
    e.preventDefault()
    if (!gram || !date || !amountPaid || !boughtFrom) return
    const newEntry = {
      id: Date.now(),
      gram: parseFloat(gram),
      date,
      amountPaid: parseFloat(amountPaid),
      purity,
      boughtFrom,
      sold: false
    }
    const newEntries = [...entries, newEntry]
    setEntries(newEntries)
    saveEntries(newEntries)
    setGram('')
    setDate('')
    setAmountPaid('')
    setBoughtFrom('')
    setPurity('24k')
    setShowModal(false)
  }

  const markAsSold = id => {
    const updated = entries.map(e => (e.id === id ? { ...e, sold: true } : e))
    setEntries(updated)
    saveEntries(updated)
  }

  // only active entries for totals
  const activeEntries = entries.filter(e => !e.sold)

  const summary = activeEntries.reduce(
    (acc, ent) => {
      acc[ent.purity].totalGrams += ent.gram
      acc[ent.purity].totalPaid += ent.amountPaid
      return acc
    },
    {
      '22k': { totalGrams: 0, totalPaid: 0 },
      '24k': { totalGrams: 0, totalPaid: 0 }
    }
  )

  const computeCurrentValue = pur => {
    const rate = pur === '22k' ? rates?.rate_per_gm22k : rates?.rate_per_gm24k
    if (!rate) return null
    return rate * summary[pur].totalGrams
    // return (rate - adjustment) * summary[pur].totalGrams
  }

  const computeProfitLoss = pur => {
    const current = computeCurrentValue(pur)
    if (current == null) return null
    return current - summary[pur].totalPaid
  }

  const removeEntry = id => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    saveEntries(updated)
  }

  const getTotalInvestmentCurrentValue = () => {
    const total = (summary['24k'].totalGrams * rates?.rate_per_gm24k) + (summary['22k'].totalGrams * rates?.rate_per_gm22k)
    return total
  }

  const getTotalInvested = () => {
    const total = summary['24k'].totalPaid + summary['22k'].totalPaid
    return total
  }

  // setRates({'24k':rate_per_gm24k,'22k':rate_per_gm22k})

  const getProfit = () => {
    const amount = getTotalInvestmentCurrentValue() - getTotalInvested()
    return formatIndianCurrency(amount)
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 max-w-md mx-auto'>
      <h1 className='text-2xl font-bold text-center mb-6'>📊 Gold Dashboard</h1>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 mb-6'>
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
            Current 24k Gold Price
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Total Invested Amount :</span>
              <span className="text-amber-500 font-semibold">
                ₹ {formatIndianCurrency(getTotalInvested())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Total Investment Current Value:</span>
              <span className="text-green-900 font-semibold">
                ₹ {formatIndianCurrency(getTotalInvestmentCurrentValue())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">P&L:</span>
              <span className="text-green-500 font-semibold">
                + ₹{getProfit() || 0}
              </span>
            </div>

            <div className="flex">
              <div className=" bg-white rounded-2xl shadow-lg p-6 w-full">
                <p className="text-gray-600 font-medium text-sm"> 24k /gm</p>
                <p className="text-gray-500 font-semibold">
                  ₹{formatIndianCurrency(rates?.rate_per_gm24k) || 0}
                </p>
              </div>

              <div className=" bg-white rounded-2xl shadow-lg p-6 w-full">
                <p className="text-gray-600 font-medium text-sm">22k /gm</p>
                <p className="text-gray-500 font-semibold">
                  ₹{formatIndianCurrency(rates?.rate_per_gm22k) || 0}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-gray-500 text-sm">
            Last fetched on: <span className="font-medium">{rates?.fetched_on ? dayjs(rates?.fetched_on).format("ddd ,DD-MM-YYYY hh:mm a") : 'N/A'}</span>
          </p>

          <button
            disabled={loading}
            onClick={() => fetchRates()}
            className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fetching...' : 'Refresh'}
          </button>
        </div>

        <div className="flex justify-between gap-2 ">
          {['22k', '24k'].map(pur => (
            <div key={pur} className='w-full bg-white rounded-xl shadow p-4'>
              <h2 className='text-lg font-semibold mb-2'>
                {pur.toUpperCase()} Summary
              </h2>
              <p>Total Grams: {summary[pur].totalGrams.toFixed(2)}</p>
              <p>Total Paid: ₹ {summary[pur].totalPaid.toFixed(2)}</p>
              <>
                <p>Rate: ₹ {pur === '22k' ? rates?.rate_per_gm22k : rates?.rate_per_gm24k ?? '--'}</p>
                <p>
                  Current Value: ₹{' '}
                  {computeCurrentValue(pur)?.toFixed(2) ?? '--'}
                </p>
                <p
                  className={
                    computeProfitLoss(pur) >= 0
                      ? 'text-green-600 font-medium'
                      : 'text-red-600 font-medium'
                  }
                >
                  Profit/Loss: ₹ {computeProfitLoss(pur)?.toFixed(2) ?? '--'}
                </p>
              </>
            </div>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <Entries entries={entries} markAsSold={markAsSold} removeEntry={removeEntry} />

      {/* Floating Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className='fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg'
      >
        ➕
      </button>

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center'>
          <div className='bg-white rounded-xl shadow-lg p-6 w-11/12 max-w-sm'>
            <h2 className='text-xl font-semibold mb-4'>Add Purchase</h2>
            <form onSubmit={handleAdd}>
              <div className='mb-3'>
                <label className='block text-sm'>Grams</label>
                <input
                  type='number'
                  step='any'
                  className='mt-1 w-full border rounded p-2'
                  value={gram}
                  onChange={e => setGram(e.target.value)}
                  required
                />
              </div>
              <div className='mb-3'>
                <label className='block text-sm'>Date</label>
                <input
                  type='date'
                  className='mt-1 w-full border rounded p-2'
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className='mb-3'>
                <label className='block text-sm'>Amount Paid (₹)</label>
                <input
                  type='number'
                  step='any'
                  className='mt-1 w-full border rounded p-2'
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  required
                />
              </div>
              <div className='mb-3'>
                <label className='block text-sm'>Bought From</label>
                <input
                  type='text'
                  className='mt-1 w-full border rounded p-2'
                  value={boughtFrom}
                  onChange={e => setBoughtFrom(e.target.value)}
                  required
                />
              </div>
              <div className='mb-3'>
                <label className='block text-sm'>Purity</label>
                <select
                  className='mt-1 w-full border rounded p-2'
                  value={purity}
                  onChange={e => setPurity(e.target.value)}
                >
                  <option value='24k'>24K</option>
                  <option value='22k'>22K</option>
                </select>
              </div>
              <div className='flex justify-end gap-3 mt-4'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='px-4 py-2 rounded bg-gray-200'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 rounded bg-blue-600 text-white'
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
