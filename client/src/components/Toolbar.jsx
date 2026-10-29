import { FILTERS } from '../constants.js';
import { CloseIcon, SearchIcon } from './Icons.jsx';

export default function Toolbar({ filter, onFilterChange, search, onSearchChange, counts }) {
  return (
    <div className="toolbar">
      <div className="filters" role="group" aria-label="Filter appointments by status">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            className="filter"
            aria-pressed={filter === option}
            onClick={() => onFilterChange(option)}
          >
            {option}
            <span className="filter__count">{counts[option] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="search">
        <span className="search__icon">
          <SearchIcon />
        </span>
        <label className="sr-only" htmlFor="search">
          Search by customer name
        </label>
        <input
          id="search"
          type="search"
          className="search__input"
          placeholder="Search customer name…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search && (
          <button
            type="button"
            className="search__clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
