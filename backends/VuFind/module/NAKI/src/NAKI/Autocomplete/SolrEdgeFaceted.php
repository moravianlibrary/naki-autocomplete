<?php
/**
 * Solr Autocomplete Module
 *
 * PHP version 7
 *
 * Copyright (C) Moravian Library 2019.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * @category VuFind2
 * @package  NAKI\Autocomplete
 * @author   Vaclav Rosecky <xrosecky@gmail.com>
 * @author   Josef Moravec <moravec@mzk.cz>
 * @license  https://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://vufind.org/wiki/development:plugins:autosuggesters Wiki
 */
namespace NAKI\Autocomplete;

/**
 * Solr Edge Faceted Autocomplete Module
 *
 * This class provides suggestions by using the local Solr index.
 *
 * @category VuFind2
 * @package  NAKI\Autocomplete
 * @author   Vaclav Rosecky <xrosecky@gmail.com>
 * @author   Josef Moravec <moravec@mzk.cz>
 * @license  https://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://vufind.org/wiki/development:plugins:autosuggesters Wiki
 */
class SolrEdgeFaceted implements \VuFind\Autocomplete\AutocompleteInterface
{
    /**
     * @var string
     */
    protected $searchClassId = 'Solr';

    /**
     * @var array
     */
    protected $modules;

    /**
     * @var \VuFind\Search\Results\PluginManager
     */
    protected $resultsManager;

    /**
     * @var
     */
    protected $searchObject;

    /**
     * Constructor
     *
     * @param \VuFind\Search\Results\PluginManager $results Results plugin manager
     */
    public function __construct(\VuFind\Search\Results\PluginManager $results)
    {
        $this->resultsManager = $results;
        $this->modules = [
            'title' => [
                'autocomplete_field' => 'title_autocomplete',
                'facet_field' => 'title_auto_str',
            ],
            'author' => [
                'autocomplete_field' => 'author_autocomplete',
                'facet_field' => 'author_str_mv',
            ],
            'subject' => [
                'autocomplete_field' => 'subject_autocomplete',
                'facet_field' => 'subject_str_mv',
            ],
        ];
        $this->initSearchObject();
    }

    /**
     * This returns an array of suggestions based on current request parameters.
     * This logic is present in the factory class so that it can be easily shared
     * by multiple AJAX handlers.
     *
     * @param string $query        The user query
     *
     * @return array
     */
    public function getSuggestions($query)
    {
        $suggestions = [];
        foreach ($this->modules as $moduleName => $moduleConfig) {
            $autocompleteField = $moduleConfig['autocomplete_field'];
            $facetField = $moduleConfig['facet_field'];

            $moduleSuggestions = array_values(
                $this->getSuggestionsWithFilters($query, $autocompleteField, $facetField)
            ) : [];
            $key = 'by' . ucfirst($moduleName);
            $suggestions[$key] = $moduleSuggestions;
        }

        return $suggestions;
    }

    /**
     * Get Suggestions by filter
     *
     * This method returns an array of strings matching the user's query for
     * display in the autocomplete box.
     *
     * @param string $query        The user query
     * @param string $autocompleteField
     * @param string $facetField
     *
     * @return array        The suggestions for the provided query
     * @throws \Exception
     */
    public function getSuggestionsWithFilters($query, $autocompleteField, $facetField): array
    {
        if (! is_object($this->searchObject)) {
            throw new \Exception('Please set configuration first.');
        }
        $results = [];
        try {
            $this->searchObject->getParams()->setBasicSearch(
                $autocompleteField.':('.$this->mungeQuery($query).')'
            );
            $params = $this->searchObject->getParams();

            $params->addFacet($facetField);
            $params->setLimit(0);
            $params->setFacetLimit(30);
            $this->searchObject->getParams()->setSort($facetField);
            $results = $this->searchObject->getResults();
            $facets  = $this->searchObject->getFacetList();

            if (isset($facets[$facetField]['list'])) {
                $queryWithoutDiacritic = $this->removeDiacritic($query);
                $queryParts            = preg_split('/\s+/', $queryWithoutDiacritic);
                $queryPartsCount       = count($queryParts);

                foreach ($facets[$facetField]['list'] as $filter) {
                    $matchedQueryParts = 0;

                    foreach ($queryParts as $queryPart) {
                        $foundItems = preg_split('/\s+/', $this->removeDiacritic($filter['value']));

                        foreach($foundItems as $foundItem) {
                            if (stripos($foundItem, $queryPart) !== false) {
                                $matchedQueryParts++;
                            }
                        }
                    }

                    if ($matchedQueryParts == $queryPartsCount) {
                        array_push($results, $filter['value']);
                    }
                }
            }

        } catch (\Exception $e) {
            // Ignore errors -- just return empty results
        }
        return array_unique($results);
    }

    /**
     * Set configuration/modules
     *
     * Set parameters that affect the behavior of the autocomplete handler.
     * These values normally come from the search configuration file.
     *
     * @param string $params Parameters to set
     *
     * @return void
     */
    public function setConfig($params)
    {
        $this->config = $params;
        $this->initSearchObject();
    }

    /**
     * Initialize search object
     *
     * Initialize the search object used for finding recommendations.
     *
     * @return void
     */
    protected function initSearchObject()
    {
        // Build a new search object:
        $this->searchObject = $this->resultsManager->get($this->searchClassId);
        $this->searchObject->getOptions()->spellcheckEnabled(false);
        $this->searchObject->getOptions()->disableHighlighting();
    }

    /**
     * Process the user query to make it suitable for a Solr query.
     *
     * @param $query
     *
     * @return mixed
     */
    protected function mungeQuery($query) {
        $forbidden = array(':', '(', ')', '*', '+', '"');
        return str_replace($forbidden, " ", $query);
    }

    /**
     * Remove diacritics from query
     *
     * @param $string String to remove diacritics from
     *
     * @return false|string
     */
    private function removeDiacritic($string) {
        return iconv("UTF-8", "ASCII//TRANSLIT", $string);
    }
}
