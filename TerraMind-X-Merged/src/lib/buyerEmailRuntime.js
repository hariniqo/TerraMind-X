function unavailableEmailDelivery() {
  throw new Error('Email delivery is not configured for this build.')
}

export async function sendBuyerEmail() {
  return unavailableEmailDelivery()
}

export async function sendDemandInquiryEmail() {
  return unavailableEmailDelivery()
}