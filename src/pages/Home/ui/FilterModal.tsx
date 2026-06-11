import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FilterItem } from '../../../shared/api/types/Filter/FilterItem'
import { FilterType } from '../../../shared/api/types/Filter/FilterType'
import { SearchRequestFilter } from '../../../shared/api/types/SearchRequest/SearchRequestFilter'
import { useFilterStore } from '../../../shared/store/useFilterStore'
import filterData from '../../../shared/temp/filterData.json'

// Описуємо, які пропси (вхідні параметри) приймає наша модалка
interface FilterModalProps {
	onClose: () => void // Функція для закриття модального вікна
}

// Допоміжний тип для збереження вибраних чекбоксів у внутрішньому стані.
// Формат буде таким: { "ID_ГРУПИ": ["id_опції_1", "id_опції_2"] }
type LocalState = Record<string, string[]>

export const FilterModal: React.FC<FilterModalProps> = ({ onClose }) => {
	// Хук для локалізації (перекладу тексту на різні мови)
	const { t } = useTranslation()

	// Беремо із глобального сховища (Zustand/Redux) збережені фільтри та функцію для їх оновлення
	const { savedFilters, setFilters } = useFilterStore()

	// Локальний стан для роботи з чекбоксами, поки користувач не натиснув "Застосувати"
	const [localFilters, setLocalFilters] = useState<LocalState>({})

	// Стан для показу вікна підтвердження (так/ні) перед збереженням
	const [showConfirm, setShowConfirm] = useState(false)

	// Беремо дані про доступні фільтри з JSON-файлу та явно кажемо TypeScript, що це масив типу FilterItem
	const filterItems = filterData.filterItems as FilterItem[]

	// Цей ефект спрацьовує при відкритті модалки або коли змінюються savedFilters.
	// Він копіює збережені фільтри з глобального стору в локальний стан модалки.
	useEffect(() => {
		if (savedFilters && savedFilters.length > 0) {
			const initialState: LocalState = {}

			// Трансформуємо масив глобальних фільтрів у зручний об'єкт { groupId: optionsIds }
			savedFilters.forEach(item => {
				initialState[item.id] = item.optionsIds
			})
			setLocalFilters(initialState)
		} else {
			// Якщо раніше нічого не було вибрано, очищаємо локальний стан
			setLocalFilters({})
		}
	}, [savedFilters])

	// Обробник кліку по чекбоксу
	const handleCheckboxChange = (groupId: string, optionId: string) => {
		setLocalFilters(prev => {
			// Отримуємо список уже вибраних опцій для цієї конкретної групи (або порожній масив)
			const currentOptions = prev[groupId] || []

			// Перевіряємо, чи ця опція вже була вибрана раніше
			const isSelected = currentOptions.includes(optionId)

			// Якщо була вибрана — видаляємо її зі списку (filter). Якщо ні — додаємо в кінець масиву ([...spread])
			const updatedOptions = isSelected
				? currentOptions.filter(id => id !== optionId)
				: [...currentOptions, optionId]

			// Повертаємо оновлений стан для всієї модалки
			return { ...prev, [groupId]: updatedOptions }
		})
	}

	// Функція, яка фіксує вибір користувача, переводить дані у потрібний для бекенду формат і закриває модалку
	const handleConfirmSave = () => {
		// Перетворюємо об'єкт { groupId: [options] } назад у масив об'єктів для API
		const formattedFilters: SearchRequestFilter = Object.entries(localFilters)
			// Виправили: прибрали '_', залишивши порожнє місце перед комою ([, optionsIds]), щоб ESLint не сварився
			.filter(([, optionsIds]) => optionsIds.length > 0)
			// Мапимо (перетворюємо) кожну групу у формат об'єкта SearchRequestFilter
			.map(([groupId, optionsIds]) => ({
				id: groupId,
				type: FilterType.OPTION, // Вказуємо тип фільтра (опціональний)
				optionsIds: optionsIds
			}))

		// Записуємо підготовлені фільтри в глобальний стор
		setFilters(formattedFilters)
		// Закриваємо маленьке вікно підтвердження
		setShowConfirm(false)
		// Закриваємо саму модалку фільтрів
		onClose()
	}

	return (
		/* Задній фон модалки (overlay) з розмиттям та затемненням */
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			{/* Головне вікно модалки з анімацією появи */}
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
				{/* Шапка модального вікна (Заголовок + кнопка закриття "Хрестик") */}
				<div className="p-6 border-b border-gray-100 flex justify-between items-center">
					<h2 className="text-2xl font-bold text-gray-900">
						{t('filters.title', 'Filters')}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-2xl p-1 leading-none transition-colors"
					>
						&times;
					</button>
				</div>

				{/* Основна частина з групами фільтрів. Має скрол, якщо фільтрів забагато */}
				<div className="p-6 overflow-y-auto space-y-6 flex-1">
					{filterItems.map(group => (
						<div
							key={group.id}
							className="space-y-3 border-b border-gray-100 pb-5 last:border-none last:pb-0"
						>
							{/* Назва групи фільтрів та її опис */}
							<div>
								<h3 className="text-base font-semibold text-gray-800">
									{t(`filters.groups.${group.id}.name`, group.name)}
								</h3>
								{group.description && (
									<p className="text-xs text-gray-500 mt-0.5">
										{t(`filters.groups.${group.id}.desc`, group.description)}
									</p>
								)}
							</div>

							{/* Сетка для відображення карток-чекбоксів */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
								{group.options.map(option => {
									// Перевіряємо, чи вибрано цей чекбокс у нашому локальному стані
									const isChecked =
										localFilters[group.id]?.includes(option.id) || false
									return (
										<label
											key={option.id}
											className={`group relative flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-200 select-none cursor-pointer ${
												isChecked
													? 'border-blue-600 bg-gradient-to-br from-blue-50/60 to-blue-50/10 ring-1 ring-blue-600 shadow-sm shadow-blue-100/50'
													: 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm'
											}`}
										>
											{/* Блок з кастомним красивим чекбоксом */}
											<div className="relative flex items-center justify-center mt-0.5 shrink-0">
												{/* Справжній інпут ховаємо з екрану (sr-only), але він працює для доступності (accessibility) */}
												<input
													type="checkbox"
													checked={isChecked}
													onChange={() =>
														handleCheckboxChange(group.id, option.id)
													}
													className="peer sr-only"
												/>
												{/* Візуальний квадратик чекбокса, який змінює колір за допомогою Tailwind */}
												<div
													className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
														isChecked
															? 'border-blue-600 bg-blue-600 text-white'
															: 'border-gray-300 bg-white group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400'
													}`}
												>
													{/* Іконка "галочки" всередині чекбокса (показується через scale-100) */}
													<svg
														className={`h-3.5 w-3.5 transform transition-transform duration-200 ${isChecked ? 'scale-100' : 'scale-0'}`}
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														strokeWidth="3"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M5 13l4 4L19 7"
														/>
													</svg>
												</div>
											</div>

											{/* Текстовий контент картки: Назва опції та її опис */}
											<div className="space-y-1 pr-2 flex-1">
												<span
													className={`text-sm font-semibold tracking-tight block transition-colors duration-200 ${
														isChecked ? 'text-blue-900' : 'text-gray-800'
													}`}
												>
													{t(`filters.options.${option.id}.name`, option.name)}
												</span>
												{option.description && (
													<p className="text-xs text-gray-500 leading-normal font-normal">
														{t(
															`filters.options.${option.id}.desc`,
															option.description
														)}
													</p>
												)}
											</div>

											{/* Додаткове синє підсвічування меж для вибраної картки */}
											{isChecked && (
												<div className="absolute inset-0 rounded-2xl border border-blue-400/20 pointer-events-none" />
											)}
										</label>
									)
								})}
							</div>
						</div>
					))}
				</div>

				{/* Футер модалки з кнопками "Скасувати" та "Застосувати" */}
				<div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
					>
						{t('common.cancel', 'Cancel')}
					</button>
					<button
						onClick={() => setShowConfirm(true)} // При кліку показуємо вікно підтвердження
						className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
					>
						{t('common.apply', 'Apply')}
					</button>
				</div>
			</div>

			{/* Маленьке діалогове вікно підтвердження (Confirmation Dialog) */}
			{showConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
					<div className="bg-white rounded-2xl shadow-xl p-5 max-w-xs w-full space-y-4 text-center border border-gray-50 animate-in zoom-in-95 duration-150">
						<h4 className="text-base font-bold text-gray-900">
							{t('confirm.title', 'Confirm Changes')}
						</h4>
						<p className="text-xs text-gray-500">
							{t(
								'confirm.message',
								'Are you sure you want to save and apply the selected filters?'
							)}
						</p>
						{/* Кнопки "Ні" (закрити вікно) та "Так" (викликати збереження) */}
						<div className="flex gap-2 pt-1">
							<button
								onClick={() => setShowConfirm(false)}
								className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
							>
								{t('common.no', 'No')}
							</button>
							<button
								onClick={handleConfirmSave}
								className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
							>
								{t('common.yes', 'Yes')}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
