import axios from 'axios';
import { showAlert } from './alerts';

/* eslint disable */
const stripe = Stripe(
  'pk_test_51UM4XNBMdEi3UUzgUx8YicFVS236lRwtJywkbZjTpW8XuheiV0WF9a4OYi7Gi2xvr3FX6KOCA6YZws1crFedNQXr00tpd5idbO',
);

export async function bookTOur(tourId) {
  try {
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`,
    );

    window.location.href = session.data.session.url;
  } catch (err) {
    console.log('err', err);
    showAlert('error', err);
  }
}
