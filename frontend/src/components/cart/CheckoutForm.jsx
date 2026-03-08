import { useState } from 'react'
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js'
import { FiLock, FiCreditCard } from 'react-icons/fi'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: "'Outfit', sans-serif",
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

const CheckoutForm = ({ clientSecret, amount, shippingAddress, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setCardError(null)

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: shippingAddress?.fullName || 'Customer',
            email: shippingAddress?.email || undefined,
          },
        },
      })

      if (error) {
        setCardError(error.message)
        onError(error.message)
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent)
      }
    } catch (err) {
      setCardError('Payment processing failed. Please try again.')
      onError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
        <FiCreditCard className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
        <div className="text-sm text-blue-700">
          <strong>Test Mode:</strong> Use card 4242 4242 4242 4242, any future date, any CVC
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
        <div className="input-field">
          <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
          <div className="input-field">
            <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">CVC</label>
          <div className="input-field">
            <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {cardError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {cardError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        <FiLock size={18} />
        {processing ? 'Processing Payment...' : `Pay $${amount?.toFixed(2)}`}
      </button>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <FiLock size={12} /> Secured by Stripe. Your payment info is encrypted.
      </p>
    </form>
  )
}

export default CheckoutForm
