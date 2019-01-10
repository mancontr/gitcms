import React, { Suspense, useState } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import Config from '../Config'
import ErrorBoundary from './ErrorBoundary'
import { WithAutoPanel, useAutoPanel } from '../api'
import './EntityEdit.sass'

export const EditField = ({ field, value, onChange }) => {
  const fieldType = Config.getType(field.type)
  if (!fieldType) {
    const values = { name: field.name, type: field.type }
    return (
      <div className="field-missing">
        <FormattedMessage id="entities.unknown-type" values={values} />
      </div>
    )
  }
  const Editor = fieldType.edit
  return (
    <div className="box field">
      <div className="label">{field.label || field.name}</div>
      {field.description && (
        <div className="description">{field.description}</div>
      )}
      <Editor field={field}
        value={value}
        onChange={onChange} />
    </div>
  )
}

EditField.propTypes = {
  field: PropTypes.object.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func
}

export const EntityEdit = () => {
  const autopanel = useAutoPanel()
  const id = autopanel.getEntityId()
  const type = autopanel.getEntityType()
  const projectId = autopanel.getProjectId()
  const typeSchema = autopanel.getEntityTypeSchema()
  const currentEntity = autopanel.getEntity() || {}
  const isNew = id === undefined

  const [entity, setEntity] = useState(currentEntity)
  const [modified, setModified] = useState(false)

  const renderFields = () =>
    typeSchema.fields.map((f) =>
      <EditField
        key={f.name}
        field={f}
        value={entity[f.name]}
        onChange={handleChange(f.name)}
      />
    )

  const handleChange = (field) => (value) => {
    setEntity({ ...entity, [field]: value })
    setModified(true)
  }

  const handleSave = () => {
    if (isNew) {
      autopanel.createEntity(entity)
        .then((res) => {
          const newId = res.id
          autopanel.go(
            '/project/' + projectId + '/entities/' + type + '/' + newId
          )
        })
    } else {
      autopanel.saveEntity(entity)
        .then(() => setModified(false))
    }
  }

  const handleRemove = () => {
    autopanel.removeEntity()
      .then(() => autopanel.go('/project/' + projectId + '/entities/' + type))
  }

  const titleId = 'entities.title.' + (isNew ? 'create' : 'edit')
  const titleValues = {
    type: typeSchema.label || typeSchema.name,
    id: id
  }

  return (
    <div id="entity-edit">
      <h1><FormattedMessage id={titleId} values={titleValues} /></h1>
      {renderFields()}
      <button className="save button" type="button" onClick={handleSave}
        disabled={!modified}>
        <FormattedMessage id={modified ? 'save' : 'saved'} />
      </button>
      {!isNew && (
        <span className="remove" onClick={handleRemove}>
          <FormattedMessage id="remove" />
        </span>
      )}
    </div>
  )
}

const EntityEditWrapper = ({ entityType, entityId }) => {
  const fallback = <div className="box"><FormattedMessage id="loading" /></div>
  const error = <div className="box"><FormattedMessage id="entities.error" /></div>
  return (
    <WithAutoPanel type={entityType} id={entityId}>
      <ErrorBoundary fallback={error}>
        <Suspense fallback={fallback}>
          <EntityEdit />
        </Suspense>
      </ErrorBoundary>
    </WithAutoPanel>
  )
}

EntityEditWrapper.propTypes = {
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.string
}

export default EntityEditWrapper
