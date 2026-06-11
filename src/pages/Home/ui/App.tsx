import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFilterStore } from '../../../shared/store/useFilterStore'
import { FilterModal } from './FilterModal'

// Виправили: тепер це стрілочна функція, як вимагає лінтер
export const App = () => {
	// Хук для локалізації тексту
	const { t } = useTranslation()

	// Локальний стан для керування видимістю модального вікна (true — відчинено, false — зачинено)
	const [isModalOpen, setIsModalOpen] = useState(false)

	// Дістаємо з глобального стору поточні збережені фільтри (savedFilters)
	// та функцію для їх оновлення (setFilters)
	const { savedFilters, setFilters } = useFilterStore()

	// Функція для швидкого видалення одного тегу (опції) прямо з головної сторінки
	const handleRemoveTag = (groupId: string, optionId: string) => {
		const updatedFilters = savedFilters
			// 1. Проходимося по всіх групах фільтрів за допомогою .map()
			.map(group => {
				// Якщо знайшли групу, з якої користувач видалив тег:
				if (group.id === groupId) {
					return {
						...group, // Копіюємо всі старі властивості групи (id, type)
						// Залишаємо тільки ті опції, які НЕ збігаються з видаленим optionId
						optionsIds: group.optionsIds.filter(id => id !== optionId)
					}
				}
				// Якщо це інша группа, повертаємо її без змін
				return group
			})
			// 2. Очищаємо масив: якщо в якійсь групі взагалі не залишилося вибраних опцій,
			// повністю видаляємо цю групу з масиву, щоб не відправляти порожній об'єкт на бекенд
			.filter(group => group.optionsIds.length > 0)

		// Оновлюємо глобальний стор новими відфільтрованими даними
		setFilters(updatedFilters)
	}

	return (
		/* Головний контейнер сторінки з максимальной шириною та відступами */
		<div className="p-6 max-w-4xl mx-auto space-y-8">
			{/* Хедер (шапка) сторінки з назвою проекту */}
			<div className="flex justify-between items-center border-b border-gray-100 pb-4">
				{/* Виправили: загорнули назву в t(), щоб прибрати помилку i18next/no-literal-string */}
				<h1 className="text-2xl font-bold tracking-tight text-gray-900">
					{t('home.brand', 'WinWinTravel')}
				</h1>
			</div>

			{/* Блок із кнопкою для відкриття фільтрів */}
			<div className="flex flex-wrap items-center gap-4">
				<button
					onClick={() => setIsModalOpen(true)} // При кліку змінюємо стан на true, що відкриває модалку
					className="px-5 py-2.5 bg-blue-600 text-sm font-medium text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98]"
				>
					{t('home.openFilters', 'Open Filters')}
				</button>
			</div>

			{/* СЕКЦІЯ АКТИВНИХ ФІЛЬТРІВ: Показується лише тоді, коли у сторі є хоча б один вибраний фільтр */}
			{savedFilters.length > 0 && (
				<div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
					{/* Виправили: загорнули текст в t(), щоб лінтер не сварився */}
					<h3 className="text-sm font-semibold text-gray-700">
						{t('home.activeFilters', 'Активные фильтры:')}
					</h3>

					{/* Контейнер для тегів, який красиво розставляє їх у рядок і переносить на новий, якщо не влазять */}
					<div className="flex flex-wrap gap-2">
						{/* Подвійний цикл: спочатку перебираємо групи фільтрів... */}
						{savedFilters.map(group =>
							/* ...а всередині кожної групи перебираємо масив ID вибраних опцій */
							group.optionsIds.map(optionId => (
								<div
									/* Створюємо унікальний ключ для React, поєднуючи ID групи та ID опції */
									key={`${group.id}-${optionId}`}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 shadow-sm"
								>
									{/* Відображаємо назву фільтра (намагаємося знайти переклад через i18next) */}
									<span>{t(`filters.options.${optionId}.name`, optionId)}</span>

									{/* Кнопка-хрестик для швидкого видалення цього конкретного тегу */}
									<button
										onClick={() => handleRemoveTag(group.id, optionId)}
										className="text-blue-400 hover:text-blue-600 font-bold p-0.5 rounded-full transition-colors leading-none"
										title={t('home.removeFilter', 'Удалить фильтр')}
									>
										&times;
									</button>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* ДЕБАГ-ПАНЕЛЬ: Показує поточний стан фільтрів у форматі JSON в реальному часі (корисно для розробника) */}
			<div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-2">
				{/* Виправили: загорнули заголовок дебагу в t() */}
				<h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
					{t(
						'home.debugTitle',
						'SearchRequestFilter (Homepage Debug Preview):'
					)}
				</h2>
				<pre className="text-xs bg-gray-900 text-emerald-400 p-4 rounded-xl overflow-x-auto font-mono shadow-inner leading-relaxed">
					{/* Перетворюємо об'єкт savedFilters на красивий рядок з відступами у 2 пробіли */}
					{JSON.stringify(savedFilters, null, 2)}
				</pre>
			</div>

			{/* РЕНДЕРИНГ МОДАЛКИ: Якщо isModalOpen дорівнює true, виводимо компонент FilterModal на екран */}
			{isModalOpen && <FilterModal onClose={() => setIsModalOpen(false)} />}
		</div>
	)
}
