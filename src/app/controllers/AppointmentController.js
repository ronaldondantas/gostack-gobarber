import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import Appointment from '../models/Appointment';
import User from '../models/User';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!checkIsProvider) {
      return res.status(401).json({
        error: 'You can only create appointments with providers',
      });
    }

    const hourStart = startOfHour(parseISO(date));

    console.log('DATE', new Date());
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const isNotAvailable = await Appointment.findOne({
      where: { date: hourStart, canceled_at: null, provider_id },
    });

    console.log('isNotAvailable', isNotAvailable);

    if (isNotAvailable) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });
    return res.json(appointment);
  }
}

export default new AppointmentController();
