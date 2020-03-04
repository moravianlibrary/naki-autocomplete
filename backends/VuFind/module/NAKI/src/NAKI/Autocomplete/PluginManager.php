<?php

/**
 * Class PluginManager
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
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * @category VuFind
 * @package  NAKI\Autocomplete
 * @author   Josef Moravec <moravec@mzk.cz>
 * @license  https://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://knihovny.cz Main Page
 */

namespace NAKI\Autocomplete;

use Laminas\ServiceManager\Factory\InvokableFactory;

/**
 * Autocomplete handler plugin manager
 *
 * @category VuFind
 * @package  NAKI\Autocomplete
 * @author   Josef Moravec <moravec@mzk.cz>
 * @license  https://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://knihovny.cz Main Page
 */
class PluginManager extends \VuFind\Autocomplete\PluginManager
{
    /**
     * Constructor
     *
     * Make sure plugins are properly initialized.
     *
     * @param mixed $configOrContainerInstance Configuration or container instance
     * @param array $v3config                  If $configOrContainerInstance is a
     *                                         container, this value will be passed to the parent constructor.
     */
    public function __construct(
        $configOrContainerInstance = null, array $v3config = []
    )
    {
        $this->addAbstractFactory(PluginFactory::class);
        parent::__construct($configOrContainerInstance, $v3config);
        $this->factories[\NAKI\Autocomplete\SolrEdgeFaceted::class]
            = \NAKI\Autocomplete\SolrEdgeFacetedFactory::class;
        $this->aliases['solredgefaceted']
            = \NAKI\Autocomplete\SolrEdgeFaceted::class;
    }
}