// ==========================================================================
//                            DG.MapModel
//
//  Author:   William Finzer
//
//  Copyright ©2014 Concord Consortium
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ==========================================================================

/** @class  DG.MapModel - The model for a map.

 @extends DG.Object
 */
DG.MapModel = SC.Object.extend(
    /** @scope DG.MapModel.prototype */
    (function () {
      var kLatNames = ['latitude', 'lat', 'latitud'],
          kLongNames = ['longitude', 'long', 'lng', 'lon', 'longitud'],
          kPolygonNames = ['boundary', 'boundaries', 'polygon', 'polygons'];

      return {
        /**
         * These two properties are from the Leaflet Map and are kept in synch for save and restore
         * by my view.
         */
        center: null,
        zoom: null,

        /**
         * This is the name of the layer used as an argument to L.esri.basemapLayer
         * {@property String}
         */
        baseMapLayerName: null,

        /**
         * Changes the visibility of the layer in Leaflet with the opacity parameter.
         * {@property Boolean}
         */
        baseMapLayerToggle: true,

        /**
         * An array of layer models such as mapPointLayerModel and mapPolygonLayerModel
         * @property {[DG.MapLayerModel]}
         */
        mapLayerModels: null,

        /**
         * Set to true during restore as flag to use to know whether to fit bounds or not
         */
        centerAndZoomBeingRestored: false,

        _addLayersForCollection: function (iContext, iCollection) {
          var tLatName, tLongName, tPolygonName,
              tMapLayerModel, tDataConfiguration,
              tLegend,
              tLayerWasAdded = false,
              tAttrNames = (iCollection && iCollection.getAttributeNames()) || [],
              // Make a copy, all lower case. We will need the original if we find a match.
              tLowerCaseNames = tAttrNames.map(function (iAttrName) {
                return iAttrName.toLowerCase();
              }),
              configureLayer = function (iInitializer, iDataConfigClass, iLayerModelClass) {
                tDataConfiguration = iDataConfigClass.create({
                  initializer: iInitializer
                });
                tLegend = DG.LegendModel.create({
                  dataConfiguration: tDataConfiguration,
                  attributeDescription: tDataConfiguration.get('legendAttributeDescription')
                });
                tLegend.addObserver('attributeDescription.attribute', this, this.legendAttributeDidChange);
                tMapLayerModel = iLayerModelClass.create({
                  dataConfiguration: tDataConfiguration,
                  legend: tLegend
                });
                this.mapLayerModels.push(tMapLayerModel);
                tMapLayerModel.invalidate();
              }.bind(this),

              contextAndAttributesAlreadyPresent = function() {
                return this.get('mapLayerModels').some( function( iLayerModel) {
                  var tDataConfig = iLayerModel.get('dataConfiguration'),
                      tExistingContext = tDataConfig.get('dataContext'),
                      tExistingLatID = tDataConfig.get('latAttributeID'),
                      tExistingLongID = tDataConfig.get('longAttributeID'),
                      tExistingPolygonID = tDataConfig.get('polygonAttributeID');
                  if( iContext === tExistingContext) {
                    var tProposedLatID = tLatName && iCollection.getAttributeByName( tLatName).get('id'),
                        tProposedLongID = tLongName && iCollection.getAttributeByName( tLongName).get('id'),
                        tProposedPolygonID = tPolygonName && iCollection.getAttributeByName( tPolygonName).get('id');
                    return (tExistingLatID === tProposedLatID && tExistingLongID === tProposedLongID) ||
                        tExistingPolygonID === tProposedPolygonID;
                  }
                  else return false;
                });
              }.bind( this);

          function pickOutName(iKNames) {
            return tAttrNames.find(function (iAttrName, iIndex) {
              return iKNames.find(function (iKName) {
                return (iKName === tLowerCaseNames[iIndex]);
              });
            });
          }

          tLatName = pickOutName(kLatNames);
          tLongName = pickOutName(kLongNames);
          tPolygonName = pickOutName(kPolygonNames);
          if (!tPolygonName) {  // Try for an attribute that has a boundary type
            ((iCollection && iCollection.get('attrs')) || []).some(function (iAttr) {
              if (iAttr.get('type') === 'boundary') {
                tPolygonName = iAttr.get('name');
                return true;
              } else {
                return false;
              }
            });
          }
          if (!contextAndAttributesAlreadyPresent()) {
            if (tLatName && tLongName) {
              tLayerWasAdded = true;
              configureLayer({
                    context: iContext, collection: iCollection,
                    latName: tLatName, longName: tLongName
                  },
                  DG.MapPointDataConfiguration, DG.MapPointLayerModel);
            }
            if (tPolygonName) {
              tLayerWasAdded = true;
              configureLayer({
                    context: iContext, collection: iCollection,
                    polygonName: tPolygonName
                  },
                  DG.MapPolygonDataConfiguration, DG.MapPolygonLayerModel);
            }
          }
          return tLayerWasAdded;
        },

        _processDocumentContexts: function() {
          var tLayerWasAdded = false;
          DG.currDocumentController().get('contexts').forEach(function (iContext) {
            iContext.get('collections').forEach(function (iCollection) {
              if( this._addLayersForCollection(iContext, iCollection))
                tLayerWasAdded = true;
            }.bind(this));
          }.bind(this));
          return tLayerWasAdded;
        },

        /**
         Prepare dependencies.
         */
        init: function () {
          sc_super();

          this.mapLayerModels = [];

          this._processDocumentContexts();

/*
          if (this.mapLayerModels.length === 0) {
            this.mapLayerModels.push(DG.MapLayerModel.create({
              dataConfiguration: DG.MapDataConfiguration.create({initializer: {}})
            }));
          }
*/

          this.set('center', [45.4408, 12.3155]); //
          this.set('zoom', 1);  // Reasonable default
          this.set('baseMapLayerName', 'Topographic');

        },

        destroy: function () {
          this.get('mapLayerModels').forEach(function (iLayerModel) {
            var tLegend = iLayerModel.get('legend');
            tLegend && tLegend.removeObserver('attributeDescription.attribute',
                this, this.legendAttributeDidChange);
          });
          sc_super();
        },

        /**
         * Called by MapController when the document's count of data contexts changes.
         * Run through our list of contexts looking for any that are no longer present.
         *  For each of those, remove corresponding layer(s).
         * For any newly encountered contexts, check to see if each contains map attributes and, if so,
         *  add a layer for each.
         */
        adaptToNewOrRemovedContexts: function() {
          var tDocumentContexts = DG.currDocumentController().get('contexts'),
              tLayerModelsToRemove = [],
              tLayerWasAdded = false;
          this.get('mapLayerModels').forEach( function( iLayerModel) {
            var tLayerContext = iLayerModel.getPath('dataConfiguration.dataContext');
            if( tLayerContext && tDocumentContexts.indexOf( tLayerContext) < 0) {
              // Previously valid context has gone away
              tLayerModelsToRemove.push( iLayerModel);
            }
          });
          tLayerWasAdded = this._processDocumentContexts();
          this.notifyPropertyChange('mapLayerModelsChange');
        },

        legendAttributeDidChange: function () {
          this.notifyPropertyChange('legendAttributeChange');
        },

        handleDroppedContext: function (iContext) {
          // Nothing to do since contexts get dealt with at the MapLayerModel
        },

        /** create a menu item that removes the attribute on the given legend */
        createRemoveAttributeMenuItem: function (iLegendView) {
          var tAttribute = iLegendView.getPath('model.attributeDescription.attribute') || DG.Analysis.kNullAttribute,
              tName = (tAttribute === DG.Analysis.kNullAttribute) ? '' : tAttribute.get('name'),
              tTitle = ('DG.DataDisplayMenu.removeAttribute_legend').loc(tName);
          return {
            title: tTitle,
            target: this,
            itemAction: this.removeLegendAttribute,
            isEnabled: (tAttribute !== DG.Analysis.kNullAttribute),
            log: "attributeRemoved: { attribute: %@, axis: %@ }".fmt(tName, 'legend'),
            args: [iLegendView.getPath('model.dataConfiguration')]
          };
        },

        createChangeAttributeTypeMenuItem: function (iLegendView) {
          var tDescription = this.getPath('model.attributeDescription'),
              tAttribute = tDescription && tDescription.get('attribute'),
              tAttributeName = tAttribute && (tAttribute !== -1) ? tAttribute.get('name') : '',
              tIsNumeric = tDescription && tDescription.get('isNumeric'),
              tTitle = (tIsNumeric ? 'DG.DataDisplayMenu.treatAsCategorical' : 'DG.DataDisplayMenu.treatAsNumeric').loc();
          return {
            title: tTitle,
            target: this,
            itemAction: this.changeAttributeType, // call with args, toggling 'numeric' setting
            isEnabled: (tAttribute !== DG.Analysis.kNullAttribute),
            log: "plotAxisAttributeChangeType: { axis: legend, attribute: %@, numeric: %@ }".fmt(tAttributeName, !tIsNumeric),
            args: [iLegendView.getPath('model.dataConfiguration'), !tIsNumeric]
          };
        },

        removeLegendAttribute: function (iDataConfiguration) {
          iDataConfiguration.setAttributeAndCollectionClient('legendAttributeDescription', null);
        },

        changeAttributeType: function (iDataConfiguration, iTreatAsNumeric) {
          iDataConfiguration.setAttributeType('legendAttributeDescription', iTreatAsNumeric);
        },

        /**
         Sets the attribute for the legend for the layer that uses the given context
         @param  {DG.DataContext}      iDataContext -- The data context for this graph
         @param  {Object}              iAttrRefs -- The attribute to set for the axis
         {DG.CollectionClient} iAttrRefs.collection -- The collection that contains the attribute
         {DG.Attribute}        iAttrRefs.attribute -- Array of attributes to set for the legend
         */
        changeAttributeForLegend: function (iDataContext, iAttrRefs) {
          this.get('mapLayerModels').forEach(function (iLayerModel) {
            if (iDataContext === iLayerModel.get('dataContext')) {
              iLayerModel.changeAttributeForLegend(iDataContext, iAttrRefs);
            }
          });
        },

        someLayerReturnsTrue: function (iPropName) {
          return this.get('mapLayerModels').some(function (iLayerModel) {
            return iLayerModel.get(iPropName);
          });
        },

        /**
         * Override superclass
         * @returns {boolean}
         */
        wantsInspector: function () {
          return this.someLayerReturnsTrue('wantsInspector');
        },

        hasLatLongAttributes: function () {
          return this.someLayerReturnsTrue('hasLatLongAttributes');
        }.property(),

        hasPolygonAttribute: function () {
          return this.someLayerReturnsTrue('hasPolygonAttribute');
        }.property('dataConfiguration'),

        /**
         * We can rescale if we have some data to rescale to.
         * @return {Boolean}
         */
        canRescale: function () {
          return this.someLayerReturnsTrue('canRescale');
        }.property('hasNumericAxis', 'plot'),

        /**
         * Not yet. Compare with dot chart <==> bart chart
         * @property {Boolean}
         */
        canSupportConfigurations: function () {
          return false;
        }.property(),

        selectAll: function (iBool) {
          this.get('mapLayerModels').forEach(function (iMapLayerModel) {
            iMapLayerModel.selectAll(iBool);
          });
        },

        /**
         * Returns true if the specified change could affect the current map
         * @param     {object}  - iChange
         * @returns   {boolean} - true if the change could affect the plot; false otherwise
         */
        isAffectedByChange: function (iChange) {
          var attrs, i, collChange, collChanges, collChangeCount;

          // returns true if the specified list of attribute IDs contains any
          // that are being displayed in the map in any graph place
          var containsMappedAttrs = function (iAttrIDs) {
            var mappedAttrs = this.getPath('dataConfiguration.placedAttributeIDs'),
                attrCount = iAttrIDs && iAttrIDs.length,
                i, attrID;
            for (i = 0; i < attrCount; ++i) {
              attrID = iAttrIDs[i];
              if (mappedAttrs.indexOf(attrID) >= 0)
                return true;
            }
            return false;
          }.bind(this);

          switch (iChange.operation) {
            case 'createCases':
            case 'deleteCases':
              return true;
            case 'updateCases':
              attrs = iChange.attributeIDs;
              if (!attrs) return true;  // all attributes affected
              return containsMappedAttrs(attrs);
            case 'dependentCases':
              collChanges = iChange.changes;
              collChangeCount = collChanges ? collChanges.length : 0;
              for (i = 0; i < collChangeCount; ++i) {
                collChange = collChanges[i];
                if (collChange) {
                  attrs = collChange.attributeIDs;
                  if (attrs && containsMappedAttrs(attrs))
                    return true;
                }
              }
              return false;
          }

          // For now, we'll assume all other changes affect us
          return true;
        },

        _observedDataConfiguration: null,

        lastValueControls: function () {
          var tControls = [];
          this.get('mapLayerModels').forEach(function (iMapLayerModel) {
            tControls = tControls.concat(iMapLayerModel.get('lastValueControls'));
          });
          return tControls;
        }.property(),

        createHideShowSelectionMenuItems: function () {
          return [];  // Todo: stopgap. Fix so that it does the right thing for the available mapLayerModels
        },

        createStorage: function () {
          var tStorage = {};
          tStorage.center = this.get('center');
          tStorage.zoom = this.get('zoom');
          tStorage.baseMapLayerName = this.get('baseMapLayerName');
          tStorage.layerModels = this.get('mapLayerModels').map(function (iLayerModel) {
            return iLayerModel.createStorage();
          });

          return tStorage;
        },

        restoreStorage: function (iStorage) {
          if (iStorage.mapModelStorage) {
            this.set('center', iStorage.mapModelStorage.center);
            this.set('zoom', iStorage.mapModelStorage.zoom);
            this.set('baseMapLayerName', iStorage.mapModelStorage.baseMapLayerName);
            this.set('centerAndZoomBeingRestored', true);
            this.get('mapLayerModels').forEach(function (iLayerModel, iIndex) {
              var tLayerStorage = SC.isArray(iStorage.mapModelStorage.layerModels) ?
                  iStorage.mapModelStorage.layerModels[iIndex] : iStorage;
              iLayerModel.restoreStorage(tLayerStorage);
            });
          }
        }

      };

    }()) // function closure
);

