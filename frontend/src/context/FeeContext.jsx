import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const FeeContext = createContext(null)

export function FeeProvider({ children }) {
    const { currentUser } = useAuth()
    const [todayFees, setTodayFees] = useState([])
    const [monthFees, setMonthFees] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchFees = useCallback(async () => {
        if (!currentUser?.token) return
        setLoading(true)
        setError(null)
        try {
            const [todayRes, monthRes] = await Promise.all([
                axios.get('/api/v1/fees/today', {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                }),
                axios.get('/api/v1/fees/month', {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                })
            ])
            setTodayFees(todayRes.data.data)
            setMonthFees(monthRes.data.data)
        } catch (err) {
            console.error('Error fetching fees:', err)
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }, [currentUser?.token])

    useEffect(() => {
        fetchFees()
    }, [fetchFees])

    const markFeePaid = async (feeId) => {
        if (!currentUser?.token) return
        try {
            await axios.patch(`/api/v1/fees/${feeId}/pay`, {}, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            })
            await fetchFees()
        } catch (err) {
            console.error('Error marking fee paid:', err)
            throw new Error(err.response?.data?.message || 'Failed to mark fee as paid')
        }
    }

    const rescheduleFee = async (feeId, newDate, notes) => {
        if (!currentUser?.token) return
        try {
            await axios.patch(`/api/v1/fees/${feeId}/reschedule`,
                { newDate, notes },
                { headers: { Authorization: `Bearer ${currentUser.token}` } }
            )
            await fetchFees()
        } catch (err) {
            console.error('Error rescheduling fee:', err)
            throw new Error(err.response?.data?.message || 'Failed to reschedule fee')
        }
    }

    const getStudentFees = async (studentId) => {
        if (!currentUser?.token) return []
        try {
            const res = await axios.get(`/api/v1/fees/student/${studentId}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            })
            return res.data.data
        } catch (err) {
            console.error('Error fetching student fees:', err)
            return []
        }
    }

    return (
        <FeeContext.Provider value={{
            todayFees,
            monthFees,
            loading,
            error,
            markFeePaid,
            rescheduleFee,
            getStudentFees,
            refreshFees: fetchFees
        }}>
            {children}
        </FeeContext.Provider>
    )
}

export function useFees() {
    const context = useContext(FeeContext)
    if (!context) {
        throw new Error('useFees must be used within a FeeProvider')
    }
    return context
}
