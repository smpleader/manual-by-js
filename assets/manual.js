function ManualByJs(options = {}){
    this.version = '0.2.1'
    this.flag = options.flag || ''
    this.folderContent = options.folderContent || 'content'
    this.homePage = options.homePage || 'page-home'
    this.searchInTableIndex = options.searchInTableIndex || true
    this.current = {}
    this.next = {}
    this.prev = {}
    this.menu = options.menu || []
    this.fileExt = options.fileExt ?? "html"
    this.prefix = options.prefix ?? "page-"
    
    this.ids = {
        menu: "mbj-menu",
        page: "mbj-page",
        pageNav: "mbj-page-nav",
        pageIndex: "mbj-page-index"
    }

    if(options.ids) this.ids = {...this.ids, ...options.ids}

    this.mbj = {}
    
    for (let [key, id] of Object.entries(this.ids)) 
    {
        this.mbj[key] = document.getElementById(id)
    }

    this.hook = {
        createMenu: null,
        createMenuItem: null,
        createPageNav: null,
        createIndexTable: null,
        createIndexTableItem: null,
        afterInit: null,
        afterRead: null,
        afterNavigate: null
    }

    if(options.hook) this.hook = {...options.hook}

    // this support for loop in hooks
    this.counter = 0
    this.flag = 0
    this.siteTitle = ""

    this._init()
}

ManualByJs.prototype = {
    read: async function(page_link){
        
        let content = await fetch(page_link)
        .then(response => response.text()) 
        .catch(error => {
            alert('Can not get page content '+ page_link )
            console.error('Error fetching the file  page', error);
        })

        if(this.hook.afterRead instanceof Function)
        {
            str = this.hook.afterRead(content)
            if(null !== str) content = str
        }

        return content
    },
    findPageByOrder: function(idx, step)
    {
        finder = idx + step
        if(finder < 0 || finder == this.menu.length ) return false
        test = this.menu[finder]
        return test.slug ?  test : this.findPageByOrder(finder, step)
    },
    findPageByHash: function(hash)
    {
        pos = hash.indexOf(this.prefix)
        if(this.prefix && pos === 0)
        {
            let finder = hash.substr(this.prefix.length) 
            
            for(var ind = 0; ind < this.menu.length; ind++)
            {
                item = this.menu[ind]
                if( item.slug && finder == item.slug )
                { 
                    item.ordering = ind
                    item.foundByIndex = 0
                    return item
                }
                else if(this.searchInTableIndex && item.index && item.index.includes(hash))
                {
                    item.ordering = ind
                    item.foundByIndex = 1
                    return item
                }
            }
        }

        return false
    },
    _createDefaultMenu: function()
    {
        this.counter = 0
        var lines = ''
        for(const item of this.menu)
        {
            this.counter++
            lines += this.hook.createMenuItem instanceof Function ? 
                this.hook.createMenuItem(item) : 
                (
                    item.slug ? 
                        '<a href="#'+ this.prefix + item.slug +'" class="'+ item.slug +'">'+ item.title +'</a>' :
                        ( item.href ? 
                            '<a href="'+ item.href +'" class="hover link" '+ (item.target?'target="'+item.target+'">':'>') + item.title +'</a>' :
                            ( item.title == '---' ? '<hr />' : '<h6><strong>'+ item.title+'</strong></h6>' )
                        )
                )
        }
                    
        this.mbj.menu.insertAdjacentHTML("beforeend", lines )
    },
    _createMenu: function() 
    {
        if(this.mbj.menu)
        {
            if(this.hook.createMenu instanceof Function)
            {
                this.hook.createMenu()
            }
            else
            {
                this._createDefaultMenu()
            }
        }
        else 
        {
            console.log("No element to keep menu!")
        }
    },
    _createDefaultIndexTable: function()  
    {
        if(this.current.index)
        { 
            var str = ''
            this.counter = 0
            for(const item of this.current.index)
            {
                this.counter++
                if(this.hook.createIndexTableItem instanceof Function)
                {
                    str += this.hook.createIndexTableItem(item)
                }
                else
                {
                    if(typeof item == "string")
                    {
                        let name = item.charAt(0).toUpperCase() + item.slice(1);
                        name = name.replace(/-|_/g, " ")
                        str += '<li><a href="#'+item+'">'+name+'</a></li>'
    
                    }
                    else if( item.id && item.name)
                    {
                        str += '<li><a href="#'+item.id+'">'+item.name+'</a></li>'
                    } 
                } 
            }
            this.mbj.pageIndex.insertAdjacentHTML("beforeend", '<ul>' + str + '</ul>') 
        }
    },
    _createIndexTable: function()  {
        if(this.mbj.pageIndex) // this element is optional
        {
            this.mbj.pageIndex.innerHTML = ""
            if(this.hook.createIndexTable instanceof Function)
            {
                this.hook.createIndexTable()
            }
            else
            {
                this._createDefaultIndexTable()
            }
        }
    },
    _updateWindowTitle: function()
    {
        if(this.siteTitle.length == 0)
        {
            this.siteTitle = document.title 
        }
        document.title = this.siteTitle  + " - " +  this.current.title
    },
    _menuActivate: function()
    {
        if(this.mbj.menu)
        {  
            const anchors = this.mbj.menu.getElementsByTagName('a')
            for(const m of anchors)
            {
                if(m.classList.contains(this.current.slug))
                {
                    m.classList.add("active")
                }
                else
                {
                    m.classList.remove("active")
                }
            }
        } 
    },
    _createDefaultPageNav: function(ordering)
    {
        this.mbj.pageNav.innerHTML = ""
        this.prev = this.findPageByOrder(ordering, -1)
        if(false == this.prev)
        {
            this.mbj.pageNav.insertAdjacentHTML("afterbegin", '<a class="invisible"><span>.</span></a>')
        } 
        else 
        {
            this.mbj.pageNav.insertAdjacentHTML("afterbegin", 
                '<a href="#'+ this.prefix + this.prev.slug+'" class="">' +
                    '<span>Previous page</span>' +
                    this.prev.title +
                '</a>');
        }

        this.next = this.findPageByOrder(ordering, 1)
        if(false !==  this.next)
        {
            this.mbj.pageNav.insertAdjacentHTML("beforeend", 
                '<a href="#'+ this.prefix + this.next.slug+'" class="text-end">' +
                    '<span>Next page</span>' +
                    this.next.title +
                '</a>');
        }
    },
    _createPageNav: function()
    {
        if(this.mbj.pageNav) // this element is optional
        {
            if(this.hook.createPageNav instanceof Function)
            {
                this.hook.createPageNav(this.current.ordering)
            }
            else
            {
                this._createDefaultPageNav(this.current.ordering)
            }
        }
    },
    _afterInit: function()
    {
        if( this.hook.afterInit instanceof Function )
        {
            this.hook.afterInit()
        }
    },
    digContent: async function(item, ext = item.fileExt??this.fileExt)
    {
        let content = ''
        
        if(!item.parts)
        {
            item.parts = [] 
            item.parts.push(item.alias ?? item.slug)
        }

        for(const part of item.parts)
        {
            link =  this.folderContent + '/' + part + '.' + ext
            content += await this.read(link)
        }
        return content
    },
    navigate: async function(hash)
    {
        let item = this.findPageByHash(hash);
        
        if(item)
        {
            this.current = item

            let content = ''//, ext = item.fileExt??

            if(!this.current.fileExt) this.current.fileExt = this.fileExt

           content = await this.digContent(item)

            if( true !== content)
            {
                this.mbj.page.innerHTML = ""
                this.mbj.page.insertAdjacentHTML("afterbegin", content)
            }

            if( this.hook.afterNavigate instanceof Function )
            {
                this.hook.afterNavigate()
            }
            else
            {
                this._afterNavigate()
            }
        }
    }, 
    _afterNavigate: function(){
        this._menuActivate()
        this._updateWindowTitle()
        this._createIndexTable()
        this._createPageNav()

        // if item found by index, we won't scroll it
        if(!this.current.foundByIndex)
        {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    },
    _init: async function()
    {
        if(this.menu.length == 0)
        {    
            this.menu = await fetch(this.folderContent + '/menu.json')
            .then(response => response.text())
            .then(data => JSON.parse(data))
            .catch(error => {
                alert('Can not create menu!')
                console.error('Error fetching the file  menu', error);
            });
        }
        
        this._createMenu()
            
        let hash = window.location.hash.substring(1);
        if(hash.length == 0) hash = this.homePage
        
        await this.navigate( hash )
 
        this._afterInit()

        // global event
        that = this
    
        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.substring(1); // Remove the '#' character
            that.navigate(hash);
        });
    }
}