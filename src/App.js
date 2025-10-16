import React, { useEffect, useState } from 'react'

const loadEntries = () => {
  try {
    const raw = localStorage.getItem('goldEntries')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
const saveEntries = entries =>
  localStorage.setItem('goldEntries', JSON.stringify(entries))

export default function App () {
  const [entries, setEntries] = useState(loadEntries())
  const [showModal, setShowModal] = useState(false)
  const [gram, setGram] = useState('')
  const [date, setDate] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [boughtFrom, setBoughtFrom] = useState('')
  const [purity, setPurity] = useState('24k')
  const [rates, setRates] = useState({
    '22k': null,
    '24k': null,
    fetched: false
  })
  const [adjustment, setAdjustment] = useState(150)

 const fetchRates = async () => {
      try {
        var myHeaders = new Headers()
        myHeaders.append('Content-Type', 'application/json')

        var requestOptions = {
          method: 'GET',
          headers: myHeaders,
          redirect: 'follow'
        }

        fetch('https://gold-rate-api-ooqd.onrender.com/api/gold-rate', requestOptions)
          .then(response => response.text())
          .then(result => console.log(result))
          .catch(error => console.log('error', error))
          
          return
          const json =''
        if (json?.rates) {
          const r22 = json.rates['VIJA-22k']
          const r24 = json.rates['VISA-24k']
          setRates({ '22k': r22, '24k': r24, fetched: true })
        }
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
    const rate = rates[pur]
    if (!rate) return null
    return (rate - adjustment) * summary[pur].totalGrams
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

  return (
    <div className='min-h-screen bg-gray-100 p-4 max-w-md mx-auto'>
      <h1 className='text-2xl font-bold text-center mb-6'>📊 Gold Dashboard</h1>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 mb-6'>
      <div>
        <button onClick={()=>fetchRates()}>Refresh</button>
      </div>
        {['22k', '24k'].map(pur => (
          <div key={pur} className='bg-white rounded-xl shadow p-4'>
            <h2 className='text-lg font-semibold mb-2'>
              {pur.toUpperCase()} Summary
            </h2>
            <p>Total Grams: {summary[pur].totalGrams.toFixed(2)}</p>
            <p>Total Paid: ₹ {summary[pur].totalPaid.toFixed(2)}</p>
            {rates.fetched && (
              <>
                <p>Rate: ₹ {rates[pur]?.toFixed(2) ?? '--'}</p>
                <p>Adjusted: ₹ {(rates[pur] - adjustment).toFixed(2)}</p>
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
            )}
          </div>
        ))}
      </div>

      {/* Entries List */}
      <div className='bg-white rounded-xl shadow p-4 mb-20'>
        <h2 className='text-lg font-semibold mb-3'>Entries</h2>
        {entries.length === 0 && <p>No entries yet.</p>}
        {entries.map(ent => (
          <div
            key={ent.id}
            className={`rounded-lg p-3 mb-3 ${
              ent.sold ? 'bg-gray-200' : 'bg-gray-50'
            } border`}
          >
            <div className=''>
              <div>
                <p className='font-medium'>
                  {ent.gram} g {ent.purity.toUpperCase()}
                </p>
                <p className='text-sm text-gray-600'>
                  Date: {ent.date} | From: {ent.boughtFrom}
                </p>
                <p className='text-sm'>Paid: ₹ {ent.amountPaid}</p>
                {ent.sold && (
                  <p className='text-xs text-red-600 font-semibold'>SOLD</p>
                )}
              </div>
              <div className='flex flex-col gap-2 mt-2'>
                {!ent.sold && (
                  <button
                    onClick={() => markAsSold(ent.id)}
                    className='bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm'
                  >
                    Mark Sold
                  </button>
                )}
                <button
                  onClick={() => removeEntry(ent.id)}
                  className='bg-red-600 text-white px-3 py-1 rounded-lg text-sm'
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
