function ManualByJs(options = {}){
    this.version = '0.1.9'
    this.flag = options.flag || ''
    this.folderContent = options.folderContent || 'content'
    this.homePage = options.homePage || 'page-home'
    this.current = {}
    this.next = {}
    this.prev = {}
    this.menu = options.menu || []
    this.fileExt = options.fileExt ?? "html"
    this.prefix = options.prefix ?? "page-"

    this.md = options.md || null
    
    this.ids = {
        sidebarMenu: "mbj-sidebar-menu",
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

    this.markdown = options.markdown || null

    this.hook = {
        createSidebarMenu: null,
        createSidebarMenuItem: null,
        createPageNav: null,
        createIndexTable: null,
        createIndexTableItem: null,
        afterInit: null
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

        if(this.markdown && this.current.fileExt == "md")
        {
            content = this.md(content)
        }

        return content
    },
    findPageByIndex: function(idx, step)
    {
        finder = idx + step
        if(finder < 0 || finder == this.menu.length ) return false
        test = this.menu[finder]
        return test.slug ?  test : this.findPageByIndex(finder, step)
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
                if( (item.slug && finder == item.slug) || 
                    (item.index && item.index.includes(hash)) )
                { 
                    item.ordering = ind
                    return item
                }
            }
        }

        return false
    },
    _createDefaultSidebarMenu: function()
    {
        this.counter = 0
        var lines = ''
        for(const item of this.menu)
        {
            this.counter++
            lines += this.hook.createSidebarMenuItem instanceof Function ? 
                this.hook.createSidebarMenuItem(item) : 
                (
                    item.slug ? 
                        '<a href="#'+ this.prefix + item.slug +'" class="'+ item.slug +'">'+ item.title +'</a>' :
                        ( item.href ? 
                            '<a href="'+ item.href +'" class="hover link" '+ (item.target?'target="'+item.target+'">':'>') + item.title +'</a>' :
                            ( item.title == '---' ? '<hr />' : '<h6><strong>'+ item.title+'</strong></h6>' )
                        )
                )
        }
                    
        this.mbj.sidebarMenu.insertAdjacentHTML("beforeend", lines )
    },
    _createSidebarMenu: function() 
    {
        if(this.mbj.sidebarMenu)
        {
            if(this.hook.createSidebarMenu instanceof Function)
            {
                this.hook.createSidebarMenu()
            }
            else
            {
                this._createDefaultSidebarMenu()
            }
        }
        else 
        {
            console.log("No element to keep Sidebar menu!")
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
    _sidebarMenuActivate: function(slug)
    {   
        const anchors = this.mbj.sidebarMenu.getElementsByTagName('a')
        for(const m of anchors)
        {
            if(m.classList.contains(slug))
            {
                m.classList.add("active")
            }
            else
            {
                m.classList.remove("active")
            }
        }
    },
    _createDefaultPageNav: function(ordering)
    {
        this.mbj.pageNav.innerHTML = ""
        this.prev = this.findPageByIndex(ordering, -1)
        if(false == this.prev)
        {
            this.mbj.pageNav.insertAdjacentHTML("afterbegin", '<a class="invisible"><span>.</span></a>')
        } 
        else 
        {
            this.mbj.pageNav.insertAdjacentHTML("afterbegin", 
                '<a href="#'+this.prev.slug+'" class="">' +
                    '<span>Previous page</span>' +
                    this.prev.title +
                '</a>');
        }

        this.next = this.findPageByIndex(ordering, 1)
        if(false !==  this.next)
        {
            this.mbj.pageNav.insertAdjacentHTML("beforeend", 
                '<a href="#'+this.next.slug+'" class="text-end">' +
                    '<span>Next page</span>' +
                    this.next.title +
                '</a>');
        }
    },
    _createPageNav: function(ordering)
    {
        if(this.mbj.pageNav) // this element is optional
        {
            if(this.hook.createPageNav instanceof Function)
            {
                this.hook.createPageNav(ordering)
            }
            else
            {
                this._createDefaultPageNav(ordering)
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
    navigate: async function(hash)
    {
        let item = this.findPageByHash(hash);
        
        if(item)
        {
            this.current = item

            let content = '', ext = item.fileExt??this.fileExt

            if(!this.current.fileExt) this.current.fileExt = ext

           
            if(item.parts)
            {
                for(const part of item.parts)
                {
                    link =  this.folderContent + '/' + part + '.' + ext
                    content += await this.read(link)
                }
            }
            else
            {
                link =  this.folderContent + '/' + (item.alias ?? item.slug) + '.' + ext
                content = await this.read(link)
            }

            if( true !== content)
            {
                this.mbj.page.innerHTML = ""
                this.mbj.page.insertAdjacentHTML("afterbegin", content)
            }

            this._sidebarMenuActivate(item.slug)
            this._updateWindowTitle()
            this._createIndexTable()
            this._createPageNav(item.ordering)

            // if item found by index, we won't scroll it
            if(item.slug === hash)
            {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
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
        
        this._createSidebarMenu()
            
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