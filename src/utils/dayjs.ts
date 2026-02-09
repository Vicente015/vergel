import dayjs from 'dayjs'
import localizedPlugin from 'dayjs/plugin/localizedFormat'

import('dayjs/locale/es')

dayjs.extend(localizedPlugin)
dayjs.locale('es')

const formatDate = (date: Date) => dayjs(date).format('ll')

export { dayjs, formatDate }
