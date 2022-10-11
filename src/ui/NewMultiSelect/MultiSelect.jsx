import cs from 'classnames'
import { useCombobox, useMultipleSelection } from 'downshift'
import identity from 'lodash/identity'
import isEqual from 'lodash/isEqual'
import pluralize from 'pluralize'
import PropTypes from 'prop-types'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import useIntersection from 'react-use/lib/useIntersection'

import Icon from '../Icon'
import SearchField from '../SearchField'
import Spinner from '../Spinner'

const SelectClasses = {
  button:
    'flex justify-between items-center w-full border border-ds-gray-tertiary rounded bg-white text-left px-3 h-8 disabled:text-ds-gray-quaternary disabled:bg-ds-gray-primary disabled:border-ds-gray-tertiary focus:outline-1',
  listContainer:
    'overflow-hidden rounded-bl rounded-br bg-white border-ds-gray-tertiary absolute w-full z-10 max-h-80 min-w-fit',
  listItem: 'block cursor-pointer py-1 px-3 text-sm',
  loadMoreTrigger: 'relative top-[-65px] invisible block leading-[0]',
}

const VariantClasses = {
  default: ``,
  gray: `bg-ds-gray-primary`,
}

const SELECT_ALL_BUTTON = 'SELECT_ALL'

function isAllButton(item) {
  return item === SELECT_ALL_BUTTON
}

function getDefaultButtonPlaceholder(items, resourceName) {
  if (items.length === 0) {
    return `All ${pluralize(resourceName, items.length)}`
  }
  return `${pluralize(resourceName, items.length, true)} selected`
}

function getSearchPlaceholder(resourceName) {
  if (resourceName) {
    return `Search for ${pluralize(resourceName)}`
  }
  return 'Search'
}

function isItemSelected(item, selectedItems) {
  return selectedItems.some((selectedItem) => isEqual(selectedItem, item))
}

function LoadMoreTrigger({ intersectionRef, onLoadMore }) {
  return (
    <>
      {onLoadMore ? (
        <span ref={intersectionRef} className={SelectClasses.loadMoreTrigger}>
          Loading more items...
        </span>
      ) : null}
    </>
  )
}

LoadMoreTrigger.propTypes = {
  onLoadMore: PropTypes.func,
  intersectionRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
}

const MultiSelect = forwardRef(
  // eslint-disable-next-line complexity
  (
    {
      ariaName,
      disabled,
      isLoading,
      items = [],
      onChange,
      onLoadMore,
      onSearch,
      renderItem = identity,
      renderSelected,
      resourceName = '',
      value = [],
      variant,
    },
    ref
  ) => {
    const intersectionRef = useRef(null)

    const {
      getDropdownProps,
      addSelectedItem,
      removeSelectedItem,
      selectedItems,
      reset,
    } = useMultipleSelection({
      initialSelectedItems: value,
      onSelectedItemsChange: ({ selectedItems }) => onChange(selectedItems),
    })

    useImperativeHandle(ref, () => ({
      resetSelected: () => {
        reset()
      },
    }))

    const toggleItem = (selectedItem) => {
      isItemSelected(selectedItem, selectedItems)
        ? removeSelectedItem(selectedItem)
        : addSelectedItem(selectedItem)
    }

    const listItems = [
      SELECT_ALL_BUTTON,
      ...selectedItems,
      ...items?.filter((item) => !isItemSelected(item, selectedItems)),
    ]

    const {
      isOpen,
      getToggleButtonProps,
      getMenuProps,
      getInputProps,
      getComboboxProps,
      highlightedIndex,
      getItemProps,
    } = useCombobox({
      selectedItem: null,
      items: listItems,
      stateReducer: (_state, { changes, type }) => {
        switch (type) {
          case useCombobox.stateChangeTypes.InputKeyDownArrowDown:
          case useCombobox.stateChangeTypes.InputKeyDownArrowUp:
          case useCombobox.stateChangeTypes.InputKeyDownEnter:
          case useCombobox.stateChangeTypes.ItemClick:
            return {
              ...changes,
              isOpen: true, // keep the menu open after selection.
            }
          default:
            break
        }
        return changes
      },
      onStateChange: ({ type, selectedItem }) => {
        switch (type) {
          case useCombobox.stateChangeTypes.InputKeyDownEnter:
          case useCombobox.stateChangeTypes.ItemClick:
            isAllButton(selectedItem) ? reset() : toggleItem(selectedItem)
            break
          default:
            break
        }
      },
    })

    const intersection = useIntersection(intersectionRef, {
      root: null,
      rootMargin: '0px',
      threshold: 0,
    })

    useEffect(() => {
      if (intersection?.isIntersecting && onLoadMore) {
        onLoadMore()
      }
    }, [intersection?.isIntersecting, onLoadMore])

    function renderSelectedItems() {
      return renderSelected
        ? renderSelected(selectedItems)
        : getDefaultButtonPlaceholder(selectedItems, resourceName)
    }

    return (
      <div className="flex-1 relative">
        <div {...getComboboxProps()}>
          <button
            aria-label={ariaName}
            className={cs(SelectClasses.button, VariantClasses[variant])}
            disabled={disabled}
            {...getDropdownProps()}
            {...getToggleButtonProps(
              getDropdownProps({ preventKeyAction: isOpen })
            )}
          >
            {renderSelectedItems()}
            <Icon
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              variant="solid"
            />
          </button>
          <div
            className={cs(!onSearch && 'invisible', 'absolute', 'inset-x-0')}
          >
            <div className={cs(!isOpen && 'invisible')}>
              <SearchField
                variant="topRounded"
                placeholder={getSearchPlaceholder(resourceName)}
                searchValue=""
                setSearchValue={(search) => onSearch(search)}
                {...getInputProps()}
              />
            </div>
          </div>
        </div>
        <ul
          aria-label={ariaName}
          className={cs(
            SelectClasses.listContainer,
            {
              'border border-gray-ds-tertiary max-h-72 overflow-scroll': isOpen,
            },
            onSearch ? 'top-16' : 'top-8'
          )}
          {...getMenuProps()}
        >
          {isOpen && (
            <>
              {listItems.map((item, index) => (
                <li
                  className={cs(SelectClasses.listItem, {
                    'px-2 font-bold border-l-4 border-l-black':
                      isItemSelected(item, selectedItems) ||
                      (isAllButton(item) && selectedItems.length === 0),
                    'bg-ds-gray-secondary': highlightedIndex === index,
                    'py-2 border-b border-ds-gray-tertiary': isAllButton(item),
                  })}
                  key={`${item}_${index}`}
                  {...getItemProps({ item, index })}
                >
                  {isAllButton(item)
                    ? `All ${pluralize(resourceName)}`
                    : renderItem(item)}
                </li>
              ))}
              {isLoading && (
                <span className="flex py-2 px-3">
                  <Spinner />
                </span>
              )}
              <LoadMoreTrigger
                intersectionRef={intersectionRef}
                onLoadMore={onLoadMore}
              />
            </>
          )}
        </ul>
      </div>
    )
  }
)

MultiSelect.displayName = 'MultiSelect'

MultiSelect.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any),
  onChange: PropTypes.func.isRequired,
  resourceName: PropTypes.string,
  onSearch: PropTypes.func,
  onLoadMore: PropTypes.func,
  value: PropTypes.any,
  renderItem: PropTypes.func,
  renderSelected: PropTypes.func,
  ariaName: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['default', 'gray']),
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
}

export default MultiSelect